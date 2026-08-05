import styles from "@/styles/styles";
import Image from "next/image";

const sponsors = [
  {
    name: "Sony",
    src: "https://logos-world.net/wp-content/uploads/2020/04/Sony-Logo.png",
  },
  {
    name: "Dell",
    src: "https://logos-world.net/wp-content/uploads/2020/08/Dell-Logo-1989-2016.png",
  },
  // https://logos-world.net/wp-content/uploads/2023/05/LG-Logo-New-500x281.png
  {
    name: "LG",
    src: "https://logos-world.net/wp-content/uploads/2023/05/LG-Logo-New-500x281.png"   
  },
  {
    name: "Apple",
    src: "https://logos-world.net/wp-content/uploads/2020/04/Apple-Logo-700x394.png"
  },
  {
    name: "Nike",
    src: "https://logos-world.net/wp-content/uploads/2020/06/Nike-Logo.png",
  },
];

const Sponsored = () => {
  return (
    <div
      className={`${styles.section} hidden sm:block bg-white py-10 px-5 mb-12 cursor-pointer rounded-xl`}
    >
      <div className="flex justify-between w-full">
        {sponsors.map((sponsor, index) => (
          <div className="flex items-start" key={index}>
            <Image
              src={sponsor.src}
              alt={`${sponsor.name} logo`}
              width={150}
              height={50}
              className="w-37.5 h-auto object-contain"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default Sponsored;