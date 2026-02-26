import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Category } from "../../../types/shop";
import styles from "./CategoryDropdownNav.module.css";

interface CategoryDropdownNavProps {
  categories: Category[];
  parentCategories: Category[];
  selectedCategory: string | null;
  selectedSubcategory: string | null;
  categoryProductCounts: Record<string, number>;
  onCategorySelect: (categoryId: string | null) => void;
  onSubcategorySelect: (subcategoryId: string, event?: React.MouseEvent) => void;
  absoluteTotalProducts: number;
  loading: boolean;
}

const CategoryDropdownNav: React.FC<CategoryDropdownNavProps> = ({
  categories,
  parentCategories,
  selectedCategory,
  selectedSubcategory,
  categoryProductCounts,
  onCategorySelect,
  onSubcategorySelect,
  absoluteTotalProducts,
  loading,
}) => {
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const getSubcategories = (parentId: string): Category[] => {
    return categories.filter((cat) => {
      const pid = cat.parentCategoryId;
      if (typeof pid === "object" && pid !== null) {
        const obj = pid as any;
        return (obj._id || obj.id) === parentId;
      }
      return pid === parentId;
    });
  };

  const getCategoryId = (cat: Category) => (cat._id || cat.id)?.toString() || "";

  const handleMouseEnter = (catId: string) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setHoveredCategory(catId);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => setHoveredCategory(null), 150);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  if (loading) {
    return (
      <div className={styles.categoriesNav}>
        <div className={styles.loading}>
          <div className={styles.loadingDot} />
          <div className={styles.loadingDot} />
          <div className={styles.loadingDot} />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.categoriesNav} ref={navRef}>
      <div className={styles.container}>
        {/* All products */}
        <button
          className={`${styles.categoryBtn} ${!selectedCategory ? styles.active : ""}`}
          onClick={() => onCategorySelect(null)}
        >
          Todo
          <span className={styles.count}>{absoluteTotalProducts}</span>
        </button>

        {/* Category buttons */}
        {parentCategories.map((cat) => {
          const catId = getCategoryId(cat);
          const subcats = getSubcategories(catId);
          const isActive = selectedCategory === catId;
          const count = categoryProductCounts[catId] ?? cat.productCount ?? 0;

          return (
            <div
              key={catId}
              className={styles.categoryWrapper}
              onMouseEnter={() => subcats.length > 0 ? handleMouseEnter(catId) : undefined}
              onMouseLeave={handleMouseLeave}
            >
              <button
                className={`${styles.categoryBtn} ${isActive ? styles.active : ""}`}
                onClick={() => onCategorySelect(catId)}
              >
                {cat.name}
                {count > 0 && <span className={styles.count}>{count}</span>}
                {subcats.length > 0 && (
                  <svg className={styles.chevron} width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                )}
              </button>

              {/* Dropdown */}
              <AnimatePresence>
                {hoveredCategory === catId && subcats.length > 0 && (
                  <motion.div
                    className={styles.dropdown}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.2 }}
                    onMouseEnter={() => handleMouseEnter(catId)}
                    onMouseLeave={handleMouseLeave}
                  >
                    {subcats.map((sub) => {
                      const subId = getCategoryId(sub);
                      const subCount = categoryProductCounts[subId] ?? sub.productCount ?? 0;
                      return (
                        <button
                          key={subId}
                          className={`${styles.dropdownItem} ${selectedSubcategory === subId ? styles.activeItem : ""}`}
                          onClick={(e) => onSubcategorySelect(subId, e)}
                        >
                          <span>{sub.name}</span>
                          {subCount > 0 && <span className={styles.dropdownCount}>{subCount}</span>}
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CategoryDropdownNav;
