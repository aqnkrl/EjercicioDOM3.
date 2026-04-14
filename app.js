const data = [
  { id: "p01", title: "Montaña", desc: "Rocas y niebla", src: "https://picsum.photos/id/1018/1200/675" },
  { id: "p02", title: "Mar", desc: "Horizonte y calma", src: "https://picsum.photos/id/1015/1200/675" },
  { id: "p03", title: "Rio", desc: "Tranquilidad", src: "https://picsum.photos/id/1011/1200/675" },
  { id: "p04", title: "Bosque", desc: "Alaska salvaje", src: "https://picsum.photos/id/1020/1200/675" },
  { id: "p05", title: "Cañon", desc: "Desierto rojizo", src: "https://picsum.photos/id/1016/1200/675" },
  { id: "p06", title: "Ruta", desc: "Camino en perspectiva", src: "https://picsum.photos/id/1005/1200/675" }
];

// Recuperar elementos del DOM
const frame = document.querySelector(".frame");
const thumbs = document.querySelector("#thumbs");//miniaturas
const heroImg = document.querySelector("#heroImg");//imagen principal
const heroTitle = document.querySelector("#heroTitle");//titulo
const heroDesc = document.querySelector("#heroDesc");//descripcion
const counter = document.querySelector("#counter");//contador
const likeBtn = document.querySelector("#likeBtn");//boton de like

const prevBtn = document.querySelector("#prevBtn");//boton de anterior
const nextBtn = document.querySelector("#nextBtn");//boton de siguiente
const playBtn = document.querySelector("#playBtn");//boton de play

// Trabajar con el estado de la aplicación
let currentIndex = 0; // Índice de la imagen actualmente mostrada
const likes = {};// Objeto para almacenar el estado de "me gusta" de cada imagen

let autoPlayId = null; // Variable para almacenar el ID del intervalo de autoplay
let isPlaying = false; // Estado para saber si el autoplay está activo o no
const AUTO_TIME = 2500; // Tiempo en milisegundos para el autoplay

// dots y tracks no existen en nuestro DOM actual 
// se intentan buscar pero si no estan se van a crear usando js
let dots = document.querySelector("#dots"); 
let track = document.querySelector(".track"); 

// cariables para detectar swipe (deslizamiento)
let startX = 0;
let currentX = 0;
let isDragging = false;
let moved = false;
// distancia mínima para considerar un swipe
const SWIPE_THRESHOLD = 50;

// para usar el modal
let modal = null;
let modalImg = null;
let modalTitle = null;
let modalDesc = null;
let counterModal = null;
let modalPrevBtn = null;
let modalNextBtn = null;
let modalCloseBtn = null;
let zoomInBtn = null;
let zoomOutBtn = null;
let zoomResetBtn = null;
let modalScale = 1;

// Crear un track del carrusel
// crear un contenedor .track que tendra todas las imagenes
// alineadas horizontalmente  en base al efecto slider con translateX
function createTrack() {
  if( track ) return; // Si el track ya existe, no hacer nada

  // si no existe, crea el track
  track = document.createElement("div");
  track.className = "track";

  data.forEach((item) => {
    const img = document.createElement("img");
    img.src = item.src;
    img.alt = item.title;
    track.appendChild(img);
  });
  frame.prepend(track); 
}

// Crear los dots de navegación
// Crear los botones indicadores del carrusel
// Cada dot va a representar una imagen
// El dot activo debe coincidir con corruntIndex
function createDots() {
  if(!dots) {
    dots = document.createElement("div");
    dots.id = "dots";
    dots.className = "dots";
    frame.appendChild(dots);
  }

  dots.innerHTML = data.map((_, index) => {
    return `
    <button
      class="dot ${index === currentIndex ?? "active"}"
      type="button"
      data-index="${index}"
      aria-label="Ir a la imagen ${index + 1}">
      </button>
    `;
  }).join("");
};

function updateTrack(animated = true) {
  if (!track) return; // Si el track no existe, no hacer nada

  track.style.transition = animated ? "transform 0.45s ease" : "none";
  track.style.transform = `translateX(-${currentIndex * 100}%)`;
}

function updateMeta(){
  const item = data[currentIndex];
  heroTitle.textContent = item.title;
  heroDesc.textContent = item.desc;
  counter.textContent = `${currentIndex + 1} / ${data.length}`;
}

function updateThumbs(){
  document.querySelectorAll(".thumb").forEach((thumb, index) => {
    thumb.classList.toggle("active", index === currentIndex);
  });
}

function updateDots(){
  document.querySelectorAll(".dot").forEach((dot, index) => {
    dot.classList.toggle("active", index === currentIndex);
    dot.setAttribute("aria-pressed", index === currentIndex);
  });
}

function updateLikeBtn(){
  const currentItem = data[currentIndex];
  const isLiked = likes[currentItem.id];
  likeBtn.textContent = isLiked ? "❤️" : "🤍";
  likeBtn.classList.toggle("on", isLiked);// Aplicar o quitar la clase visual según el estado de "me gusta"
  likeBtn.setAttribute("aria-pressed", isLiked); // Actualizar el atributo aria-pressed para accesibilidad
}


// Renderizar las miniaturas
function renderThumbs() {
  thumbs.innerHTML = data.map((item, index) => {
    return `
    <article class="thumb" ${index === currentIndex ? "active" : ""} data-index="${index}">
      <span class="badge">${index + 1}</span>
      <img src="${item.src}" alt="${item.title}" />
    </article>
    `;
  }).join("");
};

// Función para renderizar la imagen principal y su información
function renderHero(index){
  const item = data[index];

  // Actualizar la imagen principal
  heroImg.src = item.src;
  heroImg.alt = item.title;

  // Actualizar el título y la descripción
  heroTitle.textContent = item.title;
  heroDesc.textContent = item.desc;

  // Actualizar el contador
  counter.textContent = `${index + 1} / ${data.length}`;

  // Recorrer miniaturas para marcar la activa
  document.querySelectorAll(".thumb").forEach((thumb, i) => {
    thumb.classList.toggle("active", i === index);
  });

  // Actualizar el estado del botón de "me gusta"
  const isLiked = likes[item.id] === true;

  //ACambiar el simbolo
  likeBtn.textContent = isLiked ? "❤️" : "🤍";

  //Aplicar quitar la clase visual
  likeBtn.classList.toggle("on", isLiked);
}

//Manejar el click en las miniaturas
thumbs.addEventListener("click", (e) => {
  const thumb = e.target.closest(".thumb");
  if (!thumb) return; // Si no se hizo click en una miniatura, salir
  currentIndex = Number(thumb.dataset.index); // Actualizar el índice actual
  renderHero(currentIndex); // Renderizar la imagen principal con el nuevo índice
});

//Listener para el boton de like
likeBtn.addEventListener("click", () => {
  const currentItem = data[currentIndex];
  likes [currentItem.id] = !likes[currentItem.id]; 
  updateLikeBtn(); // Actualizar el estado del botón de "me gusta"
});

// Cambiar el botón de play a pause y viceversa
function updatePlayButton() {
  playBtn.textContent = isPlaying ? "⏸️" : "▶️";
  playBtn.dataset.state = isPlaying ? "pause" : "play";
}

function changeSlide( newIndex ){
  heroImg.classList.add("fade-out"); // Agregar clase para animación de desvanecimiento
  setTimeout(() => {
    currentIndex = newIndex; // Actualizar el índice actual
    renderHero(currentIndex); // Renderizar la nueva imagen principal
    heroImg.classList.remove("fade-out"); // Quitar la clase para mostrar la nueva imagen
  }, 1000);
}

function nextSlide() {
  const newIndex = (currentIndex + 1) % data.length; // Calcular el índice de la siguiente imagen
  changeSlide(newIndex);
}

function prevSlide() {
  const newIndex = (currentIndex - 1 + data.length) % data.length; // Calcular el índice de la imagen anterior
  changeSlide(newIndex);
}

function startAutoPlay() {
  autoPlayId = setInterval(() => {
    nextSlide();
  }, AUTO_TIME);
  isPlaying = true;
  updatePlayButton();
}

function stopAutoPlay() {
  clearInterval(autoPlayId);
  autoPlayId = null;
  isPlaying = false;
  updatePlayButton();
}

function toggleAutoPlay() {
  if (isPlaying) {
    stopAutoPlay();
  } else {
    startAutoPlay();
  }
}

// Renderizar toda la interfaz cada vez que cambia currentIndex
function renderAll(animate = true){
  updateTrack(animate);
  updateMeta();
  updateThumbs();
  updateDots();
  updateLikeBtn();
}

// Animación pop del like
// Agrega o elimina la clase pop para reiniciar la animación CSS al dar click
function animateLikePop() {
  likeBtn.classList.remove("pop");
  void likeBtn.offsetWidth;
  likeBtn.classList.add("pop");
}

// Manejo de SWIPE
// Registra la posición inicial del puntero y
// desactiva temporalmente la transición del track para que el movimiento sea inmediato al arrastrar
function handlePointerDown( e ) {
  startX = e.clientX;
  currentX = e.clientX;
  isDragging = true;
  moved = false;

  if (track) {
    track.style.transition = "none";
  }
}

// Manejo de SWIPE - movimiento
// Actualiza la posición actual del puntero y calcula la diferencia desde el inicio
// si el movimiento supera el umbral definido, se considera un swipe y se navega a la siguiente o anterior imagen
function handlePointerMove( e ) {
  if (!isDragging) return;

  currentX = e.clientX;
  const diff = currentX - startX;

  if (Math.abs(diff) > 5) {
    moved = true;
  }
}

// Manejo de SWIPE - finalización
// Al soltar el mouse, se calcula la distancia recorrida
// Si se superó el umbral, se navega a la siguiente o anterior imagen según la dirección del movimiento
// Si no se superó el umbral, se vuelve a la posición original
function handlePointerUp( e ) {
  if (!isDragging) return;

  const diff = currentX - startX;
  isDragging = false;

  if (Math.abs(diff) >= SWIPE_THRESHOLD) { 
    if (diff < 0) {
      nextSlide();
    }
    else {
      prevSlide();
    }
  } else {
    updateTrack( true );
  }
}


// Listeners para los botones de navegación y autoplay
nextBtn.addEventListener("click", nextSlide);
prevBtn.addEventListener("click", prevSlide);
playBtn.addEventListener("click", toggleAutoPlay);

document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowRight") {
    nextSlide();
  } else if (e.key === "ArrowLeft") {
    prevSlide();
  }
});

// Eventos de SWIPE con el mouse
frame.addEventListener("pointerdown", handlePointerDown);
frame.addEventListener("pointermove", handlePointerMove);
frame.addEventListener("pointerup", handlePointerUp);
frame.addEventListener("pointerleave", handlePointerUp);

renderThumbs();// Llamar a la funcion para mostrar las miniaturas
renderHero(currentIndex);// Mostrar la imagen inicial


// Miniaturas inferiores
const thumbsBottom = document.querySelector("#thumbsBottom");
function renderThumbsBottom() {
  thumbsBottom.innerHTML = data.map((item, index) => {
    return `
      <article class="thumb ${index === currentIndex ? "active" : ""}" data-index="${index}">
        <img src="${item.src}" alt="${item.title}" />
      </article>
    `;
  }).join("");
}
thumbsBottom.addEventListener("click", (e) => {
  const thumb = e.target.closest(".thumb");
  if (!thumb) return;

  currentIndex = Number(thumb.dataset.index);
  renderHero(currentIndex);
});

renderThumbsBottom();