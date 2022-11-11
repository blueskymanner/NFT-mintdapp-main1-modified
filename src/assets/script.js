const panels = document.querySelectorAll(".panel");
panels.forEach((panel) => {
  panel.addEventListener("click", () => {
    removeActiveClasses();
    panel.classList.add("active");
  });
});
//sadece aktif olmasını istediğimiz panelin geniş gözükmesi için önceden tıklanan panellerin eski haline getirilmesini sağlayan fonksiyondur-->
function removeActiveClasses() {
  panels.forEach((panels) => {
    panels.classList.remove("active");
  });
}
