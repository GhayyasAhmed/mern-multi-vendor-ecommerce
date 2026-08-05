import styles from "@/styles/styles";
import Image from "next/image";

const sponsors = [
  {
    name: "Sony",
    src: "https://logos-world.net/wp-content/uploads/2020/04/Sony-Logo.png",
  },
  {
    name: "Dell",
    src: "https://logos-world.net/wp-content/uploads/2020/08/Dell-Logo-1989-2010.png",
  },
  {
    name: "LG",
    src: "https://upload.wikimedia.org/wikipedia/commons/2/24/LG_logo_%282015%29.svg",
  },
  {
    name: "Apple",
    src: "https://www.vectorlogo.zone/logos/apple/apple-ar21.png",
  },
  {
    name: "Nike",
    src: "https://upload.wikimedia.org/wikipedia/commons/a/a6/Logo_NIKE.svg",
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