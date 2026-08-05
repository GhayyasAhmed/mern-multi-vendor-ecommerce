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
        <div className="branding my-12 flex justify-between w-full shadow-sm bg-white p-5 rounded-md">
          {brandingData &&
            brandingData.map((i, index) => (
              <div className="flex items-start" key={index}>
                {i.icon}
                <div className="px-3">
                  <h3 className="font-bold text-sm md:text-base">{i.title}</h3>
                  <p className="text-xs md:text-sm">{i.Description}</p>
                </div>
              </div>
            ))}
        </div>
      </div>

      <div
        className={`${styles.section} bg-white p-6 rounded-lg mb-12`}
        id="categories"
      >
        <div className="grid grid-cols-1 gap-1.25 md:grid-cols-2 md:gap-2.5 lg:grid-cols-4 lg:gap-5 xl:grid-cols-5 xl:gap-7.5">
          {categoriesData &&
            categoriesData.map((i) => (
              <div
                className="w-full h-25 flex items-center justify-between cursor-pointer overflow-hidden"
                key={i.id}
                onClick={() => handleSubmit(i)}
              >
                <h5 className="text-[18px] leading-[1.3]">{i.title}</h5>
                <Image
                  src={i.image_Url}
                  alt={i.title || "Category image"}
                  width={120}
                  height={120}
                  className="w-30 h-auto object-cover"
                />
              </div>
            ))}
        </div>
      </div>
    </>
  );
};

export default Categories;