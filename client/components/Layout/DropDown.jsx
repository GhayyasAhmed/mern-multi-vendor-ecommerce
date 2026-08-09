"use client";
import styles from "@/styles/styles";
import Image from "next/image";
import { useRouter } from "next/navigation";

const DropDown = ({ categoriesData, setDropDown }) => {
  const router = useRouter();

  const submitHandle = (i) => {
    router.push(`/products?category=${i.title}`);
    setDropDown(false);
  };

  return (
    <div className="pb-4 w-67.5 bg-white absolute z-30 rounded-b-md shadow-lg">
      {categoriesData &&
        categoriesData.map((i, index) => (
          <div
            key={index}
            className={`${styles.normalFlex} px-3 cursor-pointer hover:bg-slate-100 py-1`}
            onClick={() => submitHandle(i)}
          >
            <Image
              src={i.image_Url}
              width={25}
              height={25}
              alt={i.title || "Category icon"}
              className="object-contain ml-2.5 select-none"
            />
            <h3 className="m-3 cursor-pointer select-none text-gray-900">{i.title}</h3>
          
          </div>
        ))}
    </div>
  );
};

export default DropDown;