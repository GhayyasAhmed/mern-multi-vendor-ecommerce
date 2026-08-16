import Header from "@/components/Layout/Header";
import Hero from "@/components/Route/Hero/Hero";
import Categories from "@/components/Route/Categories/Categories";
import BestDeals from "@/components/Route/BestDeals/BestDeals";
import FeaturedProduct from "@/components/Route/FeaturedProduct/FeaturedProduct";
import Events from "@/components/Events/Events";
// import Sponsored from "@/components/Route/Sponsored";
import Footer from "@/components/Layout/Footer";

export default function HomePage() {
  return (
    <div>
      <Header activeHeading={1} />
       <main>
        <Hero />
        <Categories />
        <BestDeals />
        <Events />
        <FeaturedProduct />
        {/* <Sponsored /> */}
      </main>
      <Footer />
    </div>
  );
}