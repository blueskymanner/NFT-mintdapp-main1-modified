import { useEffect, useState } from "react";
import Web3 from "web3";
import contract from "../contracts/contract.json";
import Hero from "../assets/hero.png";

const initialInfoState = {
  connected: false,
  status: null,
  account: null,
  web3: null,
  contract: null,
  address: null,
  contractJSON: null,
};

const initialMintState = {
  loading: false,
  status: `Mint your ${contract.name}`,
  amount: 1,
  supply: "0",
  cost: "0",
  isFreeMintOpen: true,
  numberMinted: "0",
};

const maxWalletFreeSupply = 10;
const thresoldSupply = 9000;


function Minter() {
  const [info, setInfo] = useState(initialInfoState);
  const [mintInfo, setMintInfo] = useState(initialMintState);

  console.log(info);

  const init = async (_request, _contractJSON) => {
    if (window.ethereum.isMetaMask) {
      try {
        const accounts = await window.ethereum.request({
          method: _request,
        });
        const networkId = await window.ethereum.request({
          method: "net_version",
        });
        if (networkId == _contractJSON.chain_id) {
          let web3 = new Web3(window.ethereum);
          setInfo((prevState) => ({
            ...prevState,
            connected: true,
            status: null,
            account: accounts[0],
            web3: web3,
            contract: new web3.eth.Contract(
              _contractJSON.abi,
              _contractJSON.address
            ),
            contractJSON: _contractJSON,
          }));
        } else {
          setInfo(() => ({
            ...initialInfoState,
            status: `Change network to ${_contractJSON.chain}.`,
          }));
        }
      } catch (err) {
        console.log("err.message =>", err.message);
        setInfo(() => ({
          ...initialInfoState,
        }));
      }
    } else {
      setInfo(() => ({
        ...initialInfoState,
        status: "Please install metamask.",
      }));
    }
  };

  const initListeners = () => {
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", () => {
        window.location.reload();
      });
      window.ethereum.on("chainChanged", () => {
        window.location.reload();
      });
    }
  };

  const getSupply = async () => {
    const params = {
      to: info.contractJSON.address,
      from: info.account,
      data: info.contract.methods.totalSupply().encodeABI(),
    };
    try {
      const result = await window.ethereum.request({
        method: "eth_call",
        params: [params, "latest"],
      });
      setMintInfo((prevState) => ({
        ...prevState,
        supply: info.web3.utils.hexToNumberString(result),
      }));
    } catch (err) {
      setMintInfo((prevState) => ({
        ...prevState,
        supply: "0",
      }));
    }
  };

  const getCost = async () => {
    const params = {
      to: info.contractJSON.address,
      from: info.account,
      data: info.contract.methods.unitPrice().encodeABI(),
    };
    try {
      const result = await window.ethereum.request({
        method: "eth_call",
        params: [params, "latest"],
      });
      console.log(info.web3.utils.hexToNumberString(result));
      setMintInfo((prevState) => ({
        ...prevState,
        cost: info.web3.utils.hexToNumberString(result),
      }));
    } catch (err) {
      setMintInfo((prevState) => ({
        ...prevState,
        cost: "0",
      }));
    }
  };

  const getIsFreeMintopen = async () => {
    const params = {
      to: info.contractJSON.address,
      from: info.account,
      data: info.contract.methods.isFreeMintOpen().encodeABI(),
    };
    try {
      const result = await window.ethereum.request({
        method: "eth_call",
        params: [params, "latest"],
      });
      setMintInfo((prevState) => ({
        ...prevState,
        isFreeMintOpen: info.web3.utils.hexToNumberString(result),
      }));
    } catch (err) {
      setMintInfo((prevState) => ({
        ...prevState,
        isFreeMintOpen: false,
      }));
    }
  };

  const getNumberMinted = async () => {
    const params = {
      to: info.contractJSON.address,
      from: info.account,
      data: info.contract.methods.numberMinted(info.account).encodeABI(),
    };
    try {
      const result = await window.ethereum.request({
        method: "eth_call",
        params: [params, "latest"],
      });
      setMintInfo((prevState) => ({
        ...prevState,
        numberMinted: info.web3.utils.hexToNumberString(result),
      }));
    } catch (err) {
      setMintInfo((prevState) => ({
        ...prevState,
        numberMinted: "0",
      }));
    }
  };

  const mint = async () => {
    console.log(mintInfo.isFreeMintOpen, Number(mintInfo.numberMinted));

    const params1 = {
      to: info.contractJSON.address,
      from: info.account,
      value: String(
        info.web3.utils.toHex(Number(mintInfo.cost) * mintInfo.amount)
      ),
      data: info.contract.methods
        .mint(mintInfo.amount)
        .encodeABI(),
    };
    const params2 = {
      to: info.contractJSON.address,
      from: info.account,
      value: (Number(mintInfo.numberMinted) + Number(mintInfo.amount) <= Number(maxWalletFreeSupply)) ? String(
        info.web3.utils.toHex(Number(0))) : String(
          info.web3.utils.toHex((Number(mintInfo.amount) + Number(mintInfo.numberMinted) - Number(maxWalletFreeSupply)) * Number(mintInfo.cost))
        ),
      data: info.contract.methods
        .mint(mintInfo.amount)
        .encodeABI(),
    };

    try {
      setMintInfo((prevState) => ({
        ...prevState,
        loading: true,
        status: `Minting ${mintInfo.amount}...`,
      }));
      if (mintInfo.isFreeMintOpen == 0 || mintInfo.supply >= thresoldSupply) {
        const txHash = await window.ethereum.request({
          method: "eth_sendTransaction",
          params: [params1, "latest"],
        });
      } else {
        const txHash = await window.ethereum.request({
          method: "eth_sendTransaction",
          params: [params2, "latest"],
        });
      }

      setMintInfo((prevState) => ({
        ...prevState,
        loading: false,
        status:
          "Nice! Your NFT will show up on Opensea, once the transaction is successful.",
      }));
      getSupply();
    } catch (err) {
      setMintInfo((prevState) => ({
        ...prevState,
        loading: false,
        status: err.message,
      }));
    }
  };

  const updateAmount = (newAmount) => {
    if (newAmount <= 30 && newAmount >= 1) {
      setMintInfo((prevState) => ({
        ...prevState,
        amount: newAmount,
      }));
    }
  };

  const connectToContract = (_contractJSON) => {
    init("eth_requestAccounts", _contractJSON);
  };

  useEffect(() => {
    connectToContract(contract);
    initListeners();
  }, []);

  useEffect(() => {
    if (info.connected) {
      getSupply();
      getCost();
      getIsFreeMintopen();
      getNumberMinted();
    }
  }, [info.connected]);

  return (
    <div className="page">
      <div className="card">
        <div className="card_header colorGradient">
          <img className="card_header_image ns" alt={"banner"} src={Hero} />
        </div>
        {mintInfo.supply < contract.total_supply ? (
          <div className="card_body">
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <button
                disabled={!info.connected || mintInfo.cost == "0"}
                className="small_button"
                onClick={() => updateAmount(mintInfo.amount - 1)}
              >
                -
              </button>
              <div style={{ width: 10 }}></div>
              <button
                disabled={!info.connected || mintInfo.cost == "0"}
                className="button"
                onClick={() => mint()}
              >
                Mint {mintInfo.amount}
              </button>
              <div style={{ width: 10 }}></div>
              <button
                disabled={!info.connected || mintInfo.cost == "0"}
                className="small_button"
                onClick={() => updateAmount(mintInfo.amount + 1)}
              >
                +
              </button>
            </div>
            {info.connected ? (
              <div className="mint-info" style={{ display: "flex", justifyContent: "space-between" }}>
                <p style={{ color: "var(--statusText)", textAlign: "center" }}>
                  {(mintInfo.isFreeMintOpen == 0 || mintInfo.supply >= thresoldSupply) ? (info.web3?.utils.fromWei(mintInfo.cost, "ether") *
                    mintInfo.amount).toFixed(3) + " " + contract.chain_symbol : ((Number(mintInfo.numberMinted) + Number(mintInfo.amount) <= Number(maxWalletFreeSupply)) ? "FREE" : ((Number(mintInfo.amount) + Number(mintInfo.numberMinted) - Number(maxWalletFreeSupply)) * info.web3?.utils.fromWei(mintInfo.cost, "ether")).toFixed(3) + " " + contract.chain_symbol)}
                </p>
                <div style={{ width: 20 }}></div>
                <p style={{ color: "var(--statusText)", textAlign: "center" }}>
                  |
                </p>
                <div style={{ width: 20 }}></div>
                <p style={{ color: "var(--statusText)", textAlign: "center" }}>
                  {mintInfo.supply + " "}/{" " + contract.total_supply}
                </p>
              </div>
            ) : null}
            {mintInfo.status ? (
              <p className="statusText">{mintInfo.status}</p>
            ) : null}
            {info.status ? (
              <p className="statusText" style={{ color: "var(--error)" }}>
                {info.status}
              </p>
            ) : null}
          </div>
        ) : (
          <div className="card_body">
            <p style={{ color: "var(--statusText)", textAlign: "center" }}>
              {mintInfo.supply + " "}/{" " + contract.total_supply}
            </p>
            <p className="statusText">
              We've sold out! .You can still buy and trade the {contract.name}{" "}
              on marketplaces such as Opensea.
            </p>
          </div>
        )}
        <div className="card_footer colorGradient">
          <button
            className="button"
            style={{
              backgroundColor: info.connected
                ? "var(--success)"
                : "var(--warning)",
            }}
            onClick={() => connectToContract(contract)}
          >
            {info.account ? "Connected " : "Connect Wallet"}
            {info.connected ? (
              <span className="accountText" style={{ fontSize: "17px" }}>
                {String(info.account).substring(0, 6) +
                  "..." +
                  String(info.account).substring(38)}
              </span>
            ) : null}
          </button>
        </div>
        <a
          style={{
            position: "absolute",
            bottom: 45,
            left: -65,
          }}
          className="_90"
          target="_blank"
          href="https://opensea.io/collection/dystopiancatssociety"
        >
          view opensea
        </a>
      </div>
    </div>
  );
}

export default Minter;
