document.addEventListener('DOMContentLoaded', function() {
    function scrollToSection(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            window.scrollTo({
                top: element.offsetTop - 80,
                behavior: 'smooth'
            });
        }
    }
    
    document.addEventListener('click', function(e) {
        if (e.target.matches('[data-scroll]')) {
            e.preventDefault();
            const sectionId = e.target.getAttribute('data-scroll');
            scrollToSection(sectionId);
        }
        
        if (e.target.matches('a[href^="#"]')) {
            const href = e.target.getAttribute('href');
            const sectionId = href.substring(1);
            if (sectionId && document.getElementById(sectionId)) {
                e.preventDefault();
                scrollToSection(sectionId);
            }
        }
    });
});