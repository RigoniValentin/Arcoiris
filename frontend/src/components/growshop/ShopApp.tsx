import React from "react";
import ShopSection from "./sections/shop/ShopSection";
import Navbar from "./navigation/Navbar";
import Footer from "./layout/Footer";
import styles from "./ShopApp.module.css";

const ShopApp: React.FC = () => {
  return (
    <div className={styles.shopApp}>
      {/* Navbar Principal */}
      <Navbar />

      {/* Main Content */}
      <main className={styles.mainContent}>
        <ShopSection />
      </main>

      <Footer />
    </div>
  );
};

export default ShopApp;
