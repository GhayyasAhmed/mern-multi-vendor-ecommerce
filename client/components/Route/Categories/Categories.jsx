"use client";
import { brandingData, categoriesData } from "@/static/data";
import styles from "@/styles/styles";
import Image from "next/image";
import { useRouter } from "next/navigation";

const Categories = () => {
  const router = useRouter();

  const handleSubmit = (category) => {
    router.push(`/products?category=${encodeURIComponent(category.title)}`);
  };

  return (
    <>
      <div className={`${styles.section} hidden sm:block`}>
        <div className="branding my-12 flex justify-between w-full shadow-sm bg-surface border border-border p-5 rounded-lg">           
          {brandingData &&
            brandingData.map((i, index) => (
              <div className="flex items-start" key={index}>
                {i.icon}
                <div className="px-3">
                  <h3 className="font-bold text-sm md:text-base text-foreground">{i.title}</h3>
                  <p className="text-xs md:text-sm text-muted-foreground">{i.Description}</p>                
                </div>
              </div>
            ))}
        </div>
      </div>

      <div
        className={`${styles.section} bg-surface border border-border p-6 rounded-lg mb-12`} 
        id="categories"
      >
        <h2 className={styles.heading}>Shop by Category</h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4 lg:grid-cols-4 lg:gap-5 xl:grid-cols-5">           
          {categoriesData &&
            categoriesData.map((i) => (
              <button
                type="button"
                className="group w-full h-25 flex items-center justify-between overflow-hidden rounded-lg border border-border bg-background px-3 text-left transition-all hover:border-primary hover:shadow-md cursor-pointer"
                 key={i.id}
                onClick={() => handleSubmit(i)}
              >
                <h5 className="text-base leading-tight font-medium text-foreground pr-2">{i.title}</h5>                 
                <Image
                  src={i.image_Url}
                  alt={i.title || "Category image"}
                  width={120}
                  height={120}
                  className="w-20 h-auto object-cover shrink-0 transition-transform duration-300 group-hover:scale-110"                 
                />
              </button>
            ))}
        </div>
      </div>
    </>
  );
};

export default Categories;