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
      className={`${styles.section} hidden sm:block bg-surface border border-border py-10 px-5 mb-12 rounded-xl`}
    >
      <p className="mb-6 text-center text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Trusted by leading brands
      </p>
      <div className="flex flex-wrap items-center justify-between gap-6 w-full">
        {sponsors.map((sponsor, index) => (
          <div
            className="flex items-start grayscale opacity-70 transition-all duration-300 hover:grayscale-0 hover:opacity-100"
            key={index}
          >
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