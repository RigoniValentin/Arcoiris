import React, { useState, useEffect, useRef, useCallback } from "react";
import { Product, Category } from "../../../../types/shop";
import { productService } from "../../../../services/productService";
import { CategoryService } from "../../../../services/categoryService";
import styles from "./ProductsManagement.module.css";

interface ProductsManagementPremiumProps {
  products: Product[];
  categories: Category[];
  onAddProduct: () => void;
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (productId: number, filteredProducts?: Product[]) => void;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  onPageChange?: (page: number) => void;
}

export const ProductsManagementPremium: React.FC<
  ProductsManagementPremiumProps
> = ({
  products,
  categories,
  onAddProduct,
  onEditProduct,
  onDeleteProduct,
  pagination,
  onPageChange,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<
    "name" | "price" | "stockCount" | "managementId"
  >("name");
  const [filteredProducts, setFilteredProducts] = useState<Product[]>(products);
  const [isSearching, setIsSearching] = useState(false);
  const [allFilteredProducts, setAllFilteredProducts] =
    useState<Product[]>(products); // Todos los productos filtrados
  const [localPage, setLocalPage] = useState(1); // Página local para filtros
  const localLimit = 20; // Productos por página en vista filtrada
  const searchInputRef = useRef<HTMLInputElement>(null); // Ref para mantener foco del input

  // Estado para conteos jerárquicos de categorías
  const [categoryProductCounts, setCategoryProductCounts] = useState<
    Record<string, number>
  >({});

  // Función para obtener todas las subcategorías de una categoría padre
  const getSubcategoryIds = useCallback(
    (parentCategoryId: string): string[] => {
      const subcategories = categories.filter((cat) => {
        const parentId = cat.parentCategoryId;
        if (typeof parentId === "object" && parentId !== null) {
          const parentObj = parentId as any;
          return (parentObj._id || parentObj.id) === parentCategoryId;
        }
        return parentId === parentCategoryId;
      });

      let allIds = subcategories
        .map((cat) => cat._id || cat.id)
        .filter(Boolean) as string[];

      // Recursivamente obtener subcategorías de subcategorías
      subcategories.forEach((subcat) => {
        const subcatId = subcat._id || subcat.id;
        if (subcatId) {
          allIds = [...allIds, ...getSubcategoryIds(subcatId)];
        }
      });

      return allIds;
    },
    [categories],
  );

  // Función para calcular conteos de productos via API
  const calculateRealProductCounts = useCallback(async () => {
    if (!categories || categories.length === 0) {
      return;
    }

    try {
      const CACHE_KEY = "admin-category-counts-v1";
      const raw = sessionStorage.getItem(CACHE_KEY);
      const now = Date.now();
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as {
            timestamp: number;
            counts: Record<string, number>;
            size: number;
          };
          if (
            now - parsed.timestamp < 5 * 60 * 1000 &&
            parsed.size === categories.length
          ) {
            setCategoryProductCounts(parsed.counts);
            return;
          }
        } catch {}
      }

      // Intentar endpoint de una sola llamada
      try {
        const single = await CategoryService.getProductCounts({
          includeParents: true,
          includeLeaves: true,
          rollupParents: true,
        });
        if (single.success && single.data?.counts) {
          setCategoryProductCounts(single.data.counts);
          sessionStorage.setItem(
            CACHE_KEY,
            JSON.stringify({
              timestamp: now,
              counts: single.data.counts,
              size: categories.length,
            }),
          );
          return;
        }
      } catch (e) {
        console.warn(
          "Counts single-call endpoint not available (admin), using fallback",
          e,
        );
      }

      // Fallback: contar por categoría individual (rápido, limit=1)
      const counts: Record<string, number> = {};
      for (const category of categories) {
        const categoryId = category._id || category.id;
        if (!categoryId) continue;
        try {
          const result = await productService.getAllProductsWithPagination({
            categoryId,
            page: 1,
            limit: 1,
          });
          let count = 0;
          if (
            typeof result === "object" &&
            result !== null &&
            !Array.isArray(result)
          ) {
            const paginatedResult = result as {
              data: Product[];
              pagination: any;
              success: boolean;
            };
            count = paginatedResult.pagination?.total || 0;
          } else if (Array.isArray(result)) {
            count = result.length;
          }
          counts[categoryId] = count;
        } catch {
          counts[categoryId] = 0;
        }
      }
      setCategoryProductCounts(counts);
      sessionStorage.setItem(
        CACHE_KEY,
        JSON.stringify({ timestamp: now, counts, size: categories.length }),
      );
    } catch (error) {
      console.error("❌ Error calculando conteos de productos:", error);
    }
  }, [categories]);

  // Actualizar productos filtrados cuando cambien los productos recibidos
  useEffect(() => {
    console.log(
      "📦 Productos actualizados, manteniendo filtros activos si los hay...",
    );

    // Siempre actualizar allFilteredProducts con los nuevos datos
    setAllFilteredProducts(products);

    // Solo resetear filteredProducts si no hay filtros activos
    if (!searchTerm.trim() && !selectedCategory) {
      console.log("📋 Sin filtros activos, mostrando todos los productos");
      setFilteredProducts(products);
    }
  }, [products]);

  // Calcular conteos reales cuando cambien las categorías o productos
  useEffect(() => {
    calculateRealProductCounts();
  }, [categories, calculateRealProductCounts]);

  // También recalcular conteos cuando cambien los productos (después de operaciones CRUD)
  useEffect(() => {
    if (products && products.length > 0) {
      // Agregar un pequeño delay para permitir que el backend actualice
      const timer = setTimeout(() => {
        calculateRealProductCounts();
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [products, calculateRealProductCounts]);

  // Función para aplicar ordenamiento - Memoizada
  const applySorting = useCallback(
    (productList: Product[]) => {
      return [...productList].sort((a, b) => {
        switch (sortBy) {
          case "name":
            return a.name.localeCompare(b.name);
          case "price":
            return a.price - b.price;
          case "stockCount":
            return b.stockCount - a.stockCount;
          case "managementId":
            // Productos sin managementId van al final
            if (!a.managementId && !b.managementId) return 0;
            if (!a.managementId) return 1;
            if (!b.managementId) return -1;
            return a.managementId - b.managementId;
          default:
            return 0;
        }
      });
    },
    [sortBy],
  );

  // Función para aplicar paginación local - Memoizada
  const applyLocalPagination = useCallback(
    (productList: Product[], page: number) => {
      const startIndex = (page - 1) * localLimit;
      const endIndex = startIndex + localLimit;
      const paginatedResults = productList.slice(startIndex, endIndex);
      setFilteredProducts(paginatedResults);
    },
    [localLimit],
  );

  // Efecto principal para realizar búsqueda cuando cambie el término o categoría (con debounce optimizado)
  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      console.log("🔍 Aplicando filtros...", {
        searchTerm,
        selectedCategory,
        productsCount: products.length,
      });
      setIsSearching(true);
      try {
        let results: Product[] = [];

        // Determinar qué tipo de búsqueda realizar
        const hasSearchTerm = searchTerm.trim().length > 0;
        const hasCategory = selectedCategory !== null;

        if (!hasSearchTerm && !hasCategory) {
          // Sin filtros: usar productos de la página actual
          results = products;
        } else if (hasSearchTerm && hasCategory) {
          // Búsqueda combinada: categoría + texto usando API
          results = await productService.getAllProducts({
            search: searchTerm,
            categoryId: selectedCategory,
            limit: 1000, // Límite alto para obtener todos los resultados
          });
        } else if (hasSearchTerm) {
          // Solo búsqueda por texto - obtener TODOS los resultados sin límite
          results = await productService.getAllProducts({
            search: searchTerm,
            limit: 1000, // Límite alto para obtener todos los resultados
          });
        } else if (hasCategory) {
          // Solo filtro por categoría - obtener TODOS los productos sin límite
          results = await productService.getAllProducts({
            categoryId: selectedCategory,
            limit: 1000, // Límite alto para obtener todos los productos
          });
        }

        // Aplicar ordenamiento
        results = applySorting(results);

        // Guardar todos los resultados y aplicar paginación local
        setAllFilteredProducts(results);
        applyLocalPagination(results, 1);
        setLocalPage(1);
        console.log("✅ Filtros aplicados exitosamente", {
          resultsCount: results.length,
        });
      } catch (error) {
        console.error("Error en búsqueda:", error);
        // Fallback a búsqueda local sobre productos actuales
        let localResults = products;

        if (searchTerm.trim()) {
          localResults = localResults.filter(
            (product) =>
              product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
              product.description
                .toLowerCase()
                .includes(searchTerm.toLowerCase()) ||
              (product.managementId &&
                product.managementId.toString().includes(searchTerm)) ||
              product.tags.some((tag) =>
                tag.toLowerCase().includes(searchTerm.toLowerCase()),
              ),
          );
        }

        if (selectedCategory) {
          localResults = localResults.filter((product) =>
            productMatchesCategory(product, selectedCategory),
          );
        }

        const sortedResults = applySorting(localResults);
        setAllFilteredProducts(sortedResults);
        applyLocalPagination(sortedResults, 1);
        setLocalPage(1);
        console.log("✅ Filtros aplicados (fallback local)", {
          resultsCount: sortedResults.length,
        });
      } finally {
        setIsSearching(false);
      }
    }, 300); // Debounce de 300ms

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, selectedCategory, products]); // Depende de filtros y productos para re-aplicar filtros cuando se actualicen los datos

  // Efecto para manejar cambios en el ordenamiento cuando ya hay filtros aplicados
  useEffect(() => {
    // Solo re-aplicar ordenamiento si ya hay filtros activos (para evitar conflictos con el efecto principal)
    if (
      (searchTerm.trim() || selectedCategory) &&
      allFilteredProducts.length > 0
    ) {
      const sortedResults = applySorting(allFilteredProducts);
      setAllFilteredProducts(sortedResults);
      applyLocalPagination(sortedResults, localPage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortBy]); // Solo depende del ordenamiento

  // Función para manejar cambio de página local
  const handleLocalPageChange = (page: number) => {
    setLocalPage(page);
    applyLocalPagination(allFilteredProducts, page);
  };

  // Función para verificar si un producto pertenece a la categoría seleccionada
  const productMatchesCategory = (
    product: Product,
    selectedCategoryId: string | null,
  ) => {
    if (selectedCategoryId === null) return true;

    console.log("🔍 Filtrando producto:", product.name);
    console.log(
      "🔍 Product categoryId:",
      product.categoryId,
      "Selected:",
      selectedCategoryId,
    );
    console.log("🔍 Product category:", product.category);

    // Normalizar IDs para comparación (convertir a string y limpiar)
    const normalizeId = (id: any) => {
      if (!id) return null;
      return String(id).trim();
    };

    const productCatId = normalizeId(product.categoryId);
    const selectedCatId = normalizeId(selectedCategoryId);

    console.log(
      "🔍 IDs normalizados - Product:",
      productCatId,
      "Selected:",
      selectedCatId,
    );

    // Comparar directamente con categoryId normalizado
    if (productCatId && selectedCatId && productCatId === selectedCatId) {
      console.log("✅ Match por categoryId normalizado");
      return true;
    }

    // Buscar la categoría seleccionada por su ID
    const selectedCat = categories.find((cat) => {
      const catId = normalizeId(cat.id || cat._id);
      return catId === selectedCatId;
    });

    if (!selectedCat) {
      console.log("❌ No se encontró la categoría seleccionada");
      return false;
    }

    console.log("🔍 Categoría seleccionada:", selectedCat.name);

    // Comparar con el nombre de la categoría (respaldo)
    if (product.category && selectedCat.name) {
      const productCatName = product.category.toLowerCase().trim();
      const selectedCatName = selectedCat.name.toLowerCase().trim();

      if (productCatName === selectedCatName) {
        console.log("✅ Match por nombre de categoría");
        return true;
      }
    }

    // Intentar encontrar la categoría del producto por su nombre y comparar IDs
    if (product.category) {
      const productCat = categories.find(
        (cat) =>
          cat.name.toLowerCase().trim() ===
          product.category!.toLowerCase().trim(),
      );

      if (productCat) {
        const productCatIdFromName = normalizeId(
          productCat.id || productCat._id,
        );
        if (productCatIdFromName === selectedCatId) {
          console.log("✅ Match por categoría encontrada por nombre");
          return true;
        }
      }
    }

    console.log("❌ No match");
    return false;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getCategoryName = (categoryId: string, categoryName?: string) => {
    // Si tenemos el nombre de la categoría directamente, usarlo
    if (
      categoryName &&
      categoryName !== "" &&
      categoryName !== "Sin categoría"
    ) {
      return categoryName;
    }

    if (!categoryId || categoryId === "null" || categoryId === "undefined") {
      // Función temporal de respaldo: asignar categorías por nombre de producto
      if (categoryName) {
        return categoryName;
      }

      return "Sin categoría";
    }

    // Buscar la categoría por ID
    const category = categories.find((cat) => {
      const catId = cat.id || cat._id;
      return catId?.toString() === categoryId?.toString();
    });

    if (category) {
      return category.name;
    }

    // Si no se encuentra por ID, intentar buscar por nombre
    if (categoryName) {
      const categoryByName = categories.find(
        (cat) => cat.name.toLowerCase() === categoryName.toLowerCase(),
      );
      if (categoryByName) {
        return categoryByName.name;
      }
    }

    return "Sin categoría";
  };

  const getStockStatus = (stockCount: number, inStock: boolean) => {
    if (!inStock || stockCount === 0)
      return { label: "Sin Stock", className: styles.stockOut };
    if (stockCount < 10)
      return { label: "Stock Bajo", className: styles.stockLow };
    return { label: "En Stock", className: styles.stockNormal };
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.headerLeft}>
            <div className={styles.headerIcon}>📦</div>
            <div className={styles.headerText}>
              <h2 className={styles.headerTitle}>Gestión de Productos</h2>
              <p className={styles.headerSubtitle}>
                Administra tu catálogo de productos
              </p>
            </div>
          </div>
          <button className={styles.addButton} onClick={onAddProduct}>
            ➕ Nuevo Producto
          </button>
        </div>
      </div>

      <div className={styles.controls}>
        <div className={styles.searchContainer}>
          <div
            className={`${styles.searchInputWrapper} ${isSearching ? styles.searching : ""}`}
          >
            {isSearching ? (
              <span className={styles.searchSpinner}>🔍</span>
            ) : (
              <span className={styles.searchIcon}>🔍</span>
            )}
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Buscar productos por ID de gestión, nombre, descripción o etiquetas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
            {searchTerm && (
              <button
                className={styles.clearSearchButton}
                onClick={() => {
                  setSearchTerm("");
                  setLocalPage(1); // Resetear página local al limpiar búsqueda
                }}
                title="Limpiar búsqueda"
              >
                ✕
              </button>
            )}
          </div>
          {searchTerm && (
            <div className={styles.searchInfo}>
              {isSearching ? (
                "Buscando..."
              ) : (
                <>
                  {allFilteredProducts.length} resultado
                  {allFilteredProducts.length !== 1 ? "s" : ""} encontrado
                  {allFilteredProducts.length !== 1 ? "s" : ""}
                  {selectedCategory && (
                    <span style={{ color: "#667eea", marginLeft: "0.5rem" }}>
                      en categoría seleccionada
                    </span>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Indicador de filtros activos */}
        {(selectedCategory || searchTerm) && (
          <div className={styles.activeFilters}>
            <span className={styles.filtersLabel}>Filtros activos:</span>
            {searchTerm && (
              <span className={styles.filterTag}>
                🔍 "{searchTerm}"
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setLocalPage(1);
                  }}
                  className={styles.removeFilter}
                >
                  ✕
                </button>
              </span>
            )}
            {selectedCategory && (
              <span className={styles.filterTag}>
                📁{" "}
                {categories.find((c) => {
                  const categoryId = c.id || c._id;
                  return (
                    categoryId?.toString() === selectedCategory?.toString()
                  );
                })?.name || "Categoría"}
                <button
                  onClick={() => {
                    setSelectedCategory(null);
                    setLocalPage(1);
                  }}
                  className={styles.removeFilter}
                >
                  ✕
                </button>
              </span>
            )}
            <button
              onClick={() => {
                setSearchTerm("");
                setSelectedCategory(null);
                setLocalPage(1);
              }}
              className={styles.clearAllFilters}
            >
              Limpiar todos
            </button>
          </div>
        )}

        <div className={styles.filters}>
          <select
            value={selectedCategory || ""}
            onChange={(e) => {
              setSelectedCategory(e.target.value || null);
              setLocalPage(1); // Resetear página al cambiar categoría
            }}
            className={styles.filterSelect}
          >
            <option value="">📁 Todas las categorías</option>
            {(() => {
              // Crear estructura jerárquica para el dropdown
              const rootCategories = categories.filter(
                (cat) => !cat.parentCategoryId,
              );
              const getSubcategories = (parentId: string) => {
                return categories.filter((cat) => {
                  const parentCatId = cat.parentCategoryId;
                  if (typeof parentCatId === "object" && parentCatId !== null) {
                    const parentObj = parentCatId as any;
                    return (parentObj._id || parentObj.id) === parentId;
                  }
                  return parentCatId === parentId;
                });
              };

              const renderCategoryOptions = (
                categoryList: typeof categories,
                level: number = 0,
              ): React.ReactNode[] => {
                const options: React.ReactNode[] = [];

                categoryList
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .forEach((category) => {
                    const categoryId = category._id || category.id;
                    const hierarchicalCount =
                      categoryProductCounts[categoryId!] || 0;
                    const subcategories = getSubcategories(categoryId!);
                    const hasSubcategories = subcategories.length > 0;

                    // Crear indentación visual y iconografía por nivel
                    let indent = "";
                    let icon = "";
                    let cssClass = "";

                    switch (level) {
                      case 0: // Categorías raíz
                        indent = "";
                        icon = hasSubcategories ? "📂 " : "🗂️ ";
                        cssClass = "root-category";
                        break;
                      case 1: // Subcategorías nivel 1
                        indent = "  ├─ ";
                        icon = hasSubcategories ? "📁 " : "🏷️ ";
                        cssClass = "subcategory";
                        break;
                      case 2: // Subcategorías nivel 2
                        indent = "    └─ ";
                        icon = hasSubcategories ? "� " : "🏷️ ";
                        cssClass = "deep-subcategory";
                        break;
                      default: // Niveles más profundos
                        indent = "      • ";
                        icon = "🏷️ ";
                        cssClass = "deep-subcategory";
                    }

                    const displayText = hasSubcategories
                      ? `${indent}${icon}${category.name} (${hierarchicalCount} total)`
                      : `${indent}${icon}${category.name} (${hierarchicalCount} productos)`;

                    options.push(
                      <option
                        key={categoryId}
                        value={categoryId}
                        className={cssClass}
                        style={{
                          fontWeight:
                            level === 0
                              ? "bold"
                              : level === 1
                                ? "600"
                                : "normal",
                          fontSize:
                            level === 0
                              ? "0.9rem"
                              : level === 1
                                ? "0.875rem"
                                : "0.85rem",
                        }}
                      >
                        {displayText}
                      </option>,
                    );

                    // Agregar subcategorías recursivamente (limitar profundidad)
                    if (hasSubcategories && level < 2) {
                      options.push(
                        ...renderCategoryOptions(subcategories, level + 1),
                      );
                    }
                  });

                return options;
              };

              return renderCategoryOptions(rootCategories);
            })()}
          </select>

          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(
                e.target.value as
                  | "name"
                  | "price"
                  | "stockCount"
                  | "managementId",
              );
              setLocalPage(1); // Resetear página al cambiar ordenamiento
            }}
            className={styles.sortSelect}
          >
            <option value="name">Ordenar por nombre</option>
            <option value="price">Ordenar por precio</option>
            <option value="stockCount">Ordenar por stock</option>
            <option value="managementId">Ordenar por ID gestión</option>
          </select>
        </div>
      </div>

      <div className={styles.listContainer}>
        <div className={styles.listHeader}>
          <div className={styles.columnHeader}>Producto</div>
          <div className={styles.columnHeader}>ID Gestión</div>
          <div className={styles.columnHeader}>Categoría</div>
          <div className={styles.columnHeader}>Precio</div>
          <div className={styles.columnHeader}>Stock</div>
          <div className={styles.columnHeader}>Estado</div>
          <div className={styles.columnHeader}>Acciones</div>
        </div>

        <div className={styles.productsList}>
          {filteredProducts.map((product) => {
            const stockStatus = getStockStatus(
              product.stockCount,
              product.inStock,
            );
            return (
              <div
                key={product.id || product._id}
                className={styles.productRow}
              >
                <div className={styles.productInfo}>
                  <div className={styles.productImage}>
                    <img src={product.image} alt={product.name} />
                  </div>
                  <div className={styles.productDetails}>
                    <h3 className={styles.productName}>{product.name}</h3>
                    <p className={styles.productDescription}>
                      {product.description}
                    </p>
                    {product.featured && (
                      <span className={styles.featuredBadge}>⭐ Destacado</span>
                    )}
                  </div>
                </div>

                <div className={styles.managementIdInfo}>
                  <span className={styles.managementId}>
                    {product.managementId
                      ? `#${product.managementId}`
                      : "Sin ID"}
                  </span>
                </div>

                <div className={styles.categoryInfo}>
                  <span className={styles.categoryName}>
                    {getCategoryName(product.categoryId, product.category)}
                  </span>
                </div>

                <div className={styles.priceInfo}>
                  <span className={styles.price}>
                    {formatPrice(product.price)}
                  </span>
                  {product.originalPrice &&
                    product.originalPrice > product.price && (
                      <span className={styles.originalPrice}>
                        {formatPrice(product.originalPrice)}
                      </span>
                    )}
                </div>

                <div className={styles.stockInfo}>
                  <span className={styles.stockNumber}>
                    {product.stockCount}
                  </span>
                </div>

                <div className={styles.statusInfo}>
                  <span
                    className={`${styles.statusBadge} ${stockStatus.className}`}
                  >
                    {stockStatus.label}
                  </span>
                </div>

                <div className={styles.actions}>
                  <button
                    className={styles.editButton}
                    onClick={() => onEditProduct(product)}
                    title="Editar producto"
                  >
                    ✏️
                  </button>
                  <button
                    className={styles.deleteButton}
                    onClick={() => {
                      // Manejar tanto product.id como product._id y convertir a number si es necesario
                      const productId = product.id || product._id;
                      if (productId) {
                        // Si el ID es string, intentar convertirlo a number
                        const numericId =
                          typeof productId === "string"
                            ? parseInt(productId, 10)
                            : productId;
                        if (!isNaN(numericId)) {
                          // Determinar si hay filtros activos
                          const hasActiveFilters =
                            searchTerm.trim() || selectedCategory;
                          // Pasar también los productos filtrados si hay filtros activos
                          const productsToPass = hasActiveFilters
                            ? filteredProducts
                            : undefined;
                          onDeleteProduct(numericId, productsToPass);
                        } else {
                          console.error(
                            "No se pudo convertir el ID del producto a número:",
                            productId,
                          );
                        }
                      } else {
                        console.error("Producto sin ID válido:", product);
                      }
                    }}
                    title="Eliminar producto"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {filteredProducts.length === 0 && !isSearching && (
          <div className={styles.emptyState}>
            {searchTerm ? (
              <div>
                <p>
                  🔍 No se encontraron productos que coincidan con "{searchTerm}
                  "
                </p>
                <p
                  style={{
                    fontSize: "0.875rem",
                    color: "#6b7280",
                    marginTop: "0.5rem",
                  }}
                >
                  Intenta con términos diferentes o verifica la ortografía
                </p>
              </div>
            ) : selectedCategory ? (
              <p>No hay productos en la categoría seleccionada.</p>
            ) : (
              <p>No se encontraron productos.</p>
            )}
          </div>
        )}

        {isSearching && (
          <div className={styles.emptyState}>
            <p>🔍 Buscando productos...</p>
          </div>
        )}

        {/* Controles de paginación - Lógica mejorada */}
        {(() => {
          // Si hay búsqueda o filtro por categoría, usar paginación local
          const isFiltered = searchTerm.trim() || selectedCategory;

          if (isFiltered) {
            const totalFiltered = allFilteredProducts.length;
            const totalPages = Math.ceil(totalFiltered / localLimit);

            if (totalPages > 1) {
              return (
                <div className={styles.paginationContainer}>
                  <div className={styles.paginationInfo}>
                    Mostrando{" "}
                    {Math.min((localPage - 1) * localLimit + 1, totalFiltered)}{" "}
                    - {Math.min(localPage * localLimit, totalFiltered)} de{" "}
                    {totalFiltered} productos{" "}
                    {searchTerm
                      ? `(búsqueda: "${searchTerm}")`
                      : selectedCategory
                        ? "(filtrados)"
                        : ""}
                  </div>
                  <div className={styles.paginationControls}>
                    <button
                      className={`${styles.paginationButton} ${localPage <= 1 ? styles.disabled : ""}`}
                      onClick={() => handleLocalPageChange(localPage - 1)}
                      disabled={localPage <= 1}
                    >
                      ← Anterior
                    </button>

                    <span className={styles.pageInfo}>
                      Página {localPage} de {totalPages}
                    </span>

                    <button
                      className={`${styles.paginationButton} ${localPage >= totalPages ? styles.disabled : ""}`}
                      onClick={() => handleLocalPageChange(localPage + 1)}
                      disabled={localPage >= totalPages}
                    >
                      Siguiente →
                    </button>
                  </div>
                </div>
              );
            }
          } else {
            // Sin filtros, usar paginación del servidor
            if (pagination && pagination.pages > 1) {
              return (
                <div className={styles.paginationContainer}>
                  <div className={styles.paginationInfo}>
                    Mostrando{" "}
                    {Math.min(
                      (pagination.page - 1) * pagination.limit + 1,
                      pagination.total,
                    )}{" "}
                    -{" "}
                    {Math.min(
                      pagination.page * pagination.limit,
                      pagination.total,
                    )}{" "}
                    de {pagination.total} productos
                  </div>
                  <div className={styles.paginationControls}>
                    <button
                      className={`${styles.paginationButton} ${!pagination.hasPrev ? styles.disabled : ""}`}
                      onClick={() =>
                        onPageChange &&
                        pagination.hasPrev &&
                        onPageChange(pagination.page - 1)
                      }
                      disabled={!pagination.hasPrev}
                    >
                      ← Anterior
                    </button>

                    <span className={styles.pageInfo}>
                      Página {pagination.page} de {pagination.pages}
                    </span>

                    <button
                      className={`${styles.paginationButton} ${!pagination.hasNext ? styles.disabled : ""}`}
                      onClick={() =>
                        onPageChange &&
                        pagination.hasNext &&
                        onPageChange(pagination.page + 1)
                      }
                      disabled={!pagination.hasNext}
                    >
                      Siguiente →
                    </button>
                  </div>
                </div>
              );
            }
          }

          return null; // No mostrar paginación si no es necesaria
        })()}
      </div>
    </div>
  );
};
