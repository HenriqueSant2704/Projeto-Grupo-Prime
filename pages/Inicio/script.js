 const slides = document.getElementById('slides');
    const nextBtn = document.getElementById('nextBtn');
    const totalSlides = 3;
    let index = 0;

    function showSlide(i) {
      slides.style.transform = `translateX(-${i * 100}vw)`;
    }

    function nextSlide() {
      index = (index + 1) % totalSlides;
      showSlide(index);
    }

    nextBtn.addEventListener('click', nextSlide);
    setInterval(nextSlide, 6000); 