import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const galleryItems = [
  {
    id: 1,
    image: "https://images.unsplash.com/photo-1611501275019-9b5cda994e8d?w=600&h=800&fit=crop",
    title: "Геометрия",
    description: "Минималистичный геометрический узор с тонкими линиями и симметричными формами",
  },
  {
    id: 2,
    image: "https://images.unsplash.com/photo-1590246814883-57c511c5e5c4?w=600&h=800&fit=crop",
    title: "Флористика",
    description: "Нежные цветочные мотивы с детальной проработкой лепестков и листьев",
  },
  {
    id: 3,
    image: "https://images.unsplash.com/photo-1598371839696-5c5bb00bdc28?w=600&h=800&fit=crop",
    title: "Лайнворк",
    description: "Графическая работа в технике тонких линий с художественной композицией",
  },
  {
    id: 4,
    image: "https://images.unsplash.com/photo-1560707303-4e980ce876ad?w=600&h=800&fit=crop",
    title: "Орнамент",
    description: "Изысканный узор с переплетением традиционных и современных элементов",
  },
  {
    id: 5,
    image: "https://images.unsplash.com/photo-1565058379802-bbe93b2f703a?w=600&h=800&fit=crop",
    title: "Дотворк",
    description: "Точечная техника создающая уникальную текстуру и глубину изображения",
  },
];

const GallerySection = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % galleryItems.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + galleryItems.length) % galleryItems.length);
  };

  const currentItem = galleryItems[currentIndex];

  return (
    <section className="relative py-16 md:py-24 bg-background overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-primary/15 rounded-full blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[150px]" />
      </div>

      {/* Decorative corner elements */}
      <div className="absolute top-20 left-10 w-20 h-20 border-l-2 border-t-2 border-primary/30 rounded-tl-lg" />
      <div className="absolute top-20 right-10 w-20 h-20 border-r-2 border-t-2 border-primary/30 rounded-tr-lg" />
      <div className="absolute bottom-20 left-10 w-20 h-20 border-l-2 border-b-2 border-primary/30 rounded-bl-lg" />
      <div className="absolute bottom-20 right-10 w-20 h-20 border-r-2 border-b-2 border-primary/30 rounded-br-lg" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-3 tracking-wide">
            Мои работы
          </h2>
          <p className="text-primary text-sm md:text-base uppercase tracking-[0.3em]">
            Каждая работа — уникальная история
          </p>
        </div>

        {/* Main content */}
        <div className="flex items-center justify-center gap-4 md:gap-8 lg:gap-16">
          {/* Left arrow */}
          <button
            onClick={prevSlide}
            className="group relative p-3 md:p-4"
            aria-label="Предыдущая работа"
          >
            <div className="absolute inset-0 bg-primary/20 rounded-lg blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
            <ChevronLeft className="w-8 h-8 md:w-10 md:h-10 text-primary relative z-10 transition-transform group-hover:-translate-x-1" />
          </button>

          {/* Phone mockup */}
          <div className="relative">
            {/* Phone glow */}
            <div className="absolute -inset-4 bg-gradient-to-b from-primary/30 via-primary/10 to-primary/30 rounded-[3rem] blur-xl" />
            
            {/* Phone frame */}
            <div className="relative bg-gradient-to-b from-zinc-800 to-zinc-900 rounded-[2.5rem] p-2 shadow-2xl">
              {/* Inner bezel */}
              <div className="bg-black rounded-[2rem] p-1 relative overflow-hidden">
                {/* Notch */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-black rounded-b-2xl z-20" />
                
                {/* Screen content */}
                <div className="relative w-[280px] md:w-[320px] h-[500px] md:h-[580px] rounded-[1.8rem] overflow-hidden">
                  <img
                    src={currentItem.image}
                    alt={currentItem.title}
                    className="w-full h-full object-cover transition-all duration-500"
                  />
                  
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  
                  {/* Title on image */}
                  <div className="absolute bottom-6 left-0 right-0 text-center">
                    <h3 className="text-white font-display text-2xl md:text-3xl font-semibold drop-shadow-lg">
                      {currentItem.title}
                    </h3>
                  </div>
                </div>
              </div>
              
              {/* Side buttons */}
              <div className="absolute right-[-2px] top-24 w-1 h-12 bg-zinc-700 rounded-l-sm" />
              <div className="absolute right-[-2px] top-40 w-1 h-8 bg-zinc-700 rounded-l-sm" />
              <div className="absolute left-[-2px] top-28 w-1 h-16 bg-zinc-700 rounded-r-sm" />
            </div>
          </div>

          {/* Right arrow */}
          <button
            onClick={nextSlide}
            className="group relative p-3 md:p-4"
            aria-label="Следующая работа"
          >
            <div className="absolute inset-0 bg-primary/20 rounded-lg blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
            <ChevronRight className="w-8 h-8 md:w-10 md:h-10 text-primary relative z-10 transition-transform group-hover:translate-x-1" />
          </button>
        </div>

        {/* Dot indicators */}
        <div className="flex justify-center gap-3 mt-8">
          {galleryItems.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                index === currentIndex
                  ? "bg-primary w-8 shadow-[0_0_10px_hsl(var(--primary))]"
                  : "bg-muted-foreground/40 hover:bg-muted-foreground/60"
              }`}
              aria-label={`Перейти к работе ${index + 1}`}
            />
          ))}
        </div>

        {/* Description */}
        <div className="mt-10 max-w-xl mx-auto text-center">
          <p className="font-display text-xl md:text-2xl italic text-primary/90 mb-3">
            Описание работы:
          </p>
          <p className="text-muted-foreground text-base md:text-lg leading-relaxed">
            «{currentItem.description}»
          </p>
        </div>
      </div>
    </section>
  );
};

export default GallerySection;
