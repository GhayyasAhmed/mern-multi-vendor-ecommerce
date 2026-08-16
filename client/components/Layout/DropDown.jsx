"use client";
import styles from "@/styles/styles";
import Image from "next/image";
import Link from "next/link";

const DropDown = ({ categoriesData, setDropDown }) => {
  return (
    <div className="pb-4 w-67.5 bg-surface border border-border absolute z-30 rounded-b-md shadow-lg">
      {categoriesData &&
        categoriesData.map((i, index) => (
          <Link
            href={`/products?category=${encodeURIComponent(i.title)}`}
            key={index}
            onClick={() => setDropDown(false)}
            className={`${styles.normalFlex} w-full text-left px-3 hover:bg-surface-hover py-1 min-h-11`}
          >
            <Image
              src={i.image_Url}
              width={25}
              height={25}
              sizes="25px"
              alt={i.title || "Category icon"}
              className="object-contain ml-2.5 select-none"
            />
            <h3 className="m-3 select-none text-foreground">{i.title}</h3>
          </Link>
        ))}
    </div>
  );
};

export default DropDown;