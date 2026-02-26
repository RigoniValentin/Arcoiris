import React, { useState, useMemo, useEffect } from "react";
import { Category } from "../../../../types/shop";
import { buildCategoryHierarchy } from "../../../../utils/categoryUtils";
import { CategoryService } from "../../../../services/categoryService";
import styles from "./CategoriesManagement.module.css";

interface CategoriesManagementPremiumProps {
  categories: Category[];
  onAddCategory: () => void;
  onEditCategory: (category: Category) => void;
  onDeleteCategory: (category: Category) => void;
  onSyncCounters?: () => void;
}

export const CategoriesManagementPremium: React.FC<
  CategoriesManagementPremiumProps
> = ({
  categories,
  onAddCategory,
  onEditCategory,
  onDeleteCategory,
  onSyncCounters,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "productCount">("name");
  const [viewMode, setViewMode] = useState<"flat" | "hierarchy">("hierarchy");
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(),
  );
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [directCounts, setDirectCounts] = useState<Record<string, number>>({});

  // Cargar conteos en una llamada (si el backend lo soporta)
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const CACHE_KEY = "admin-categories-counts-v2";
        const raw = sessionStorage.getItem(CACHE_KEY);
        const now = Date.now();
        if (raw) {
          try {
            const parsed = JSON.parse(raw) as {
              timestamp: number;
              counts: Record<string, number>; // rollup=true
              directCounts?: Record<string, number>; // rollup=false
              size: number;
            };
            if (
              now - parsed.timestamp < 5 * 60 * 1000 &&
              parsed.size === categories.length
            ) {
              if (!cancelled) {
                setCounts(parsed.counts);
                if (parsed.directCounts) setDirectCounts(parsed.directCounts);
              }
              return;
            }
          } catch {}
        }

        // Obtener ambos mapas: rollup (para display general) y direct (para validar si un padre tiene productos directos)
        const [rollupRes, directRes] = await Promise.all([
          CategoryService.getProductCounts({
            includeParents: true,
            includeLeaves: true,
            rollupParents: true,
          }),
          CategoryService.getProductCounts({
            includeParents: true,
            includeLeaves: true,
            rollupParents: false,
          }),
        ]);

        if (!cancelled) {
          const rollupCounts =
            rollupRes.success && rollupRes.data?.counts
              ? rollupRes.data.counts
              : {};
          const direct =
            directRes.success && directRes.data?.counts
              ? directRes.data.counts
              : {};
          setCounts(rollupCounts);
          setDirectCounts(direct);
          sessionStorage.setItem(
            CACHE_KEY,
            JSON.stringify({
              timestamp: now,
              counts: rollupCounts,
              directCounts: direct,
              size: categories.length,
            }),
          );
        }
      } catch (e) {
        // Silencioso, caerá al uso de category.productCount
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [categories]);

  // Función para verificar si una categoría es hoja (no tiene subcategorías)
  const isLeafCategory = (categoryId: string): boolean => {
    return !categories.some((cat) => {
      const parentId = cat.parentCategoryId;
      if (typeof parentId === "object" && parentId !== null) {
        const parentObj = parentId as any;
        return (parentObj._id || parentObj.id) === categoryId;
      }
      return parentId === categoryId;
    });
  };

  // Construir jerarquía de categorías
  const hierarchicalCategories = useMemo(() => {
    return buildCategoryHierarchy(categories);
  }, [categories]);

  // Función para expandir/contraer categorías
  const toggleExpanded = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  // Renderizar categoría con subcategorías
  const renderCategoryWithSubcategories = (
    category: Category,
    level: number = 0,
  ) => {
    const categoryId = category._id || category.id;
    const isExpanded = expandedCategories.has(categoryId!);
    const hasSubcategories =
      category.subcategories && category.subcategories.length > 0;
    const indent = level * 24; // 24px por nivel

    return (
      <React.Fragment key={categoryId}>
        <div
          className={`${styles.categoryRow} ${
            level > 0 ? styles.subcategoryRow : ""
          } ${hasSubcategories ? styles.hasSubcategories : ""}`}
          style={{ paddingLeft: `${16 + indent}px` }}
        >
          <div className={styles.categoryInfo}>
            <div className={styles.expandButton}>
              {hasSubcategories ? (
                <button
                  onClick={() => toggleExpanded(categoryId!)}
                  className={styles.expandToggle}
                  title={
                    isExpanded
                      ? "Contraer subcategorías"
                      : "Expandir subcategorías"
                  }
                  aria-label={isExpanded ? "Contraer" : "Expandir"}
                >
                  {isExpanded ? (
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z" />
                    </svg>
                  ) : (
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" />
                    </svg>
                  )}
                </button>
              ) : (
                <span className={styles.expandPlaceholder}>
                  <svg
                    width="8"
                    height="8"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <circle cx="12" cy="12" r="2" />
                  </svg>
                </span>
              )}
            </div>
            <div className={styles.categoryIcon}>
              <span>{category.icon}</span>
            </div>
            <div className={styles.categoryDetails}>
              <h3 className={styles.categoryName}>
                {category.name}
                {level > 0 && (
                  <span className={styles.levelIndicator}> (Subcategoría)</span>
                )}
              </h3>
              <p className={styles.categoryDescription}>
                {category.description}
              </p>
              {category.parentCategoryId && (
                <p className={styles.parentInfo}>
                  Padre:{" "}
                  {(() => {
                    // Extraer el ID del parentCategoryId (puede ser string u objeto)
                    let parentIdString: string;
                    if (
                      typeof category.parentCategoryId === "object" &&
                      category.parentCategoryId !== null
                    ) {
                      const parentObj = category.parentCategoryId as any;
                      parentIdString = parentObj._id || parentObj.id;
                    } else {
                      parentIdString = category.parentCategoryId as string;
                    }

                    // Buscar la categoría padre en la lista completa de categorías
                    const foundCategory = categories.find((c) => {
                      const categoryId = c._id || c.id;
                      return (
                        categoryId?.toString() === parentIdString?.toString()
                      );
                    });

                    return foundCategory?.name || "No encontrada";
                  })()}
                </p>
              )}
            </div>
          </div>

          <div className={styles.productCount}>
            {!isLeafCategory(categoryId!) ? (
              // Categoría padre - solo mostrar que es categoría padre
              <span className={`${styles.countBadge} ${styles.parentCategory}`}>
                📁 Categoría padre
              </span>
            ) : (
              // Categoría hoja - mostrar productos y que puede tener productos
              <div className={styles.leafCategoryInfo}>
                <span className={`${styles.countBadge} ${styles.leafCategory}`}>
                  {(counts[categoryId!] ?? category.productCount) || 0} producto
                  {((counts[categoryId!] ?? category.productCount) || 0) !== 1
                    ? "s"
                    : ""}
                </span>
                <span className={styles.categoryCapability}>
                  ✓ Apta para productos
                </span>
              </div>
            )}
            {/* Mostrar advertencia SOLO si categoría padre tiene productos DIRECTOS asignados */}
            {!isLeafCategory(categoryId!) &&
              (directCounts[categoryId!] || 0) > 0 && (
                <div
                  className={styles.warningIndicator}
                  title="Esta categoría padre tiene productos asignados incorrectamente"
                >
                  ⚠️
                </div>
              )}
          </div>

          <div className={styles.actions}>
            <button
              className={styles.editButton}
              onClick={() => onEditCategory(category)}
              title="Editar categoría"
            >
              ✏️
            </button>
            <button
              className={styles.deleteButton}
              onClick={() => onDeleteCategory(category)}
              title="Eliminar categoría"
            >
              🗑️
            </button>
          </div>
        </div>

        {/* Renderizar subcategorías si está expandida */}
        {hasSubcategories && isExpanded && (
          <>
            {category.subcategories!.map((subcategory) =>
              renderCategoryWithSubcategories(subcategory, level + 1),
            )}
          </>
        )}
      </React.Fragment>
    );
  };

  const filteredCategories = categories
    .filter((category) =>
      category.name.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    .sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "productCount":
          return b.productCount - a.productCount;
        default:
          return 0;
      }
    });

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.headerLeft}>
            <div className={styles.headerIcon}>🏷️</div>
            <div className={styles.headerText}>
              <h2 className={styles.headerTitle}>Gestión de Categorías</h2>
              <p className={styles.headerSubtitle}>
                Organiza y administra las categorías de tu tienda
              </p>
            </div>
          </div>
          <div className={styles.headerActions}>
            {onSyncCounters && (
              <button
                className={styles.syncButton}
                onClick={onSyncCounters}
                title="Sincronizar contadores de productos"
              >
                🔄 Sincronizar
              </button>
            )}
            <button className={styles.addButton} onClick={onAddCategory}>
              ➕ Nueva Categoría
            </button>
          </div>
        </div>
      </div>

      <div className={styles.controls}>
        <div className={styles.searchContainer}>
          <input
            type="text"
            placeholder="Buscar categorías..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <div className={styles.filters}>
          <select
            value={viewMode}
            onChange={(e) =>
              setViewMode(e.target.value as "flat" | "hierarchy")
            }
            className={styles.sortSelect}
          >
            <option value="hierarchy">Vista jerárquica</option>
            <option value="flat">Vista plana</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) =>
              setSortBy(e.target.value as "name" | "productCount")
            }
            className={styles.sortSelect}
          >
            <option value="name">Ordenar por nombre</option>
            <option value="productCount">Ordenar por productos</option>
          </select>
        </div>
      </div>

      <div className={styles.listContainer}>
        <div className={styles.listHeader}>
          <div className={styles.columnHeader}>Categoría</div>
          <div className={styles.columnHeader}>Productos</div>
          <div className={styles.columnHeader}>Acciones</div>
        </div>

        <div className={styles.categoriesList}>
          {viewMode === "hierarchy" ? (
            // Vista jerárquica
            hierarchicalCategories.length > 0 ? (
              hierarchicalCategories
                .filter((category) =>
                  category.name
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase()),
                )
                .sort((a, b) => {
                  switch (sortBy) {
                    case "name":
                      return a.name.localeCompare(b.name);
                    case "productCount":
                      return b.productCount - a.productCount;
                    default:
                      return 0;
                  }
                })
                .map((category) => renderCategoryWithSubcategories(category))
            ) : (
              <div className={styles.emptyState}>
                <p>No se encontraron categorías.</p>
              </div>
            )
          ) : (
            // Vista plana (original)
            filteredCategories.map((category) => (
              <div key={category.id} className={styles.categoryRow}>
                <div className={styles.categoryInfo}>
                  <div className={styles.categoryIcon}>
                    <span>{category.icon}</span>
                  </div>
                  <div className={styles.categoryDetails}>
                    <h3 className={styles.categoryName}>
                      {category.name}
                      {category.parentCategoryId && (
                        <span className={styles.levelIndicator}>
                          {" "}
                          (Subcategoría)
                        </span>
                      )}
                    </h3>
                    <p className={styles.categoryDescription}>
                      {category.description}
                    </p>
                    {category.parentCategoryId && (
                      <p className={styles.parentInfo}>
                        Categoría padre:{" "}
                        {(() => {
                          const foundCategory = categories.find((c) => {
                            const categoryId = c._id || c.id;
                            const parentId = category.parentCategoryId;

                            // Si parentCategoryId es un objeto, extraer el ID
                            let parentIdString: string;
                            if (
                              typeof parentId === "object" &&
                              parentId !== null
                            ) {
                              const parentObj = parentId as any; // Cast temporal para acceder a las propiedades
                              parentIdString = parentObj._id || parentObj.id;
                            } else {
                              parentIdString = parentId as string;
                            }

                            return (
                              categoryId?.toString() ===
                              parentIdString?.toString()
                            );
                          });
                          return foundCategory?.name || "No encontrada";
                        })()}
                      </p>
                    )}
                  </div>
                </div>

                <div className={styles.productCount}>
                  {(() => {
                    const categoryId = category._id || category.id;
                    return !isLeafCategory(categoryId!) ? (
                      // Categoría padre - solo mostrar que es categoría padre
                      <span
                        className={`${styles.countBadge} ${styles.parentCategory}`}
                      >
                        📁 Categoría padre
                      </span>
                    ) : (
                      // Categoría hoja - mostrar productos y que puede tener productos
                      <div className={styles.leafCategoryInfo}>
                        <span
                          className={`${styles.countBadge} ${styles.leafCategory}`}
                        >
                          {category.productCount} producto
                          {category.productCount !== 1 ? "s" : ""}
                        </span>
                        <span className={styles.categoryCapability}>
                          ✓ Apta para productos
                        </span>
                      </div>
                    );
                  })()}
                </div>

                <div className={styles.categoryActions}>
                  <button
                    className={styles.editButton}
                    onClick={() => onEditCategory(category)}
                    title="Editar categoría"
                  >
                    ✏️
                  </button>
                  <button
                    className={styles.deleteButton}
                    onClick={() => onDeleteCategory(category)}
                    title="Eliminar categoría"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {viewMode === "flat" && filteredCategories.length === 0 && (
          <div className={styles.emptyState}>
            <p>No se encontraron categorías que coincidan con la búsqueda.</p>
          </div>
        )}
      </div>
    </div>
  );
};
