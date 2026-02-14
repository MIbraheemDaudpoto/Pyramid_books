import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Book } from "@shared/schema";
import { BOOK_CATEGORIES } from "@shared/schema";
import { useAddToCart } from "@/hooks/use-cart";
import { useToast } from "@/hooks/use-toast";
import GlassCard from "@/components/GlassCard";
import SectionHeader from "@/components/SectionHeader";
import EmptyState from "@/components/EmptyState";
import { Search, ShoppingCart, BookOpen, Filter, User, Hash, Building, Tag, CheckCircle2, XCircle } from "lucide-react";
import { formatCurrency, cn } from "@/lib/utils";

function BookCard({ book, onAdd, isPending }: { book: Book; onAdd: (b: Book) => void; isPending: boolean }) {
  const inStock = book.stockQty != null && book.stockQty > 0;

  return (
    <GlassCard className="h-100 d-flex flex-column border-0 shadow-sm p-3 group hover:translate-y-[-4px] transition-all duration-300">
      <div className="flex-grow-1">
        <div className="p-3 bg-light rounded-4 text-primary d-flex align-items-center justify-content-center mb-3" style={{ height: '140px' }}>
          <BookOpen className="w-12 h-12 opacity-20" />
        </div>

        <h6 className="fw-bold mb-1 text-dark" data-testid={`book-title-${book.id}`}>{book.title}</h6>

        <div className="vstack gap-1 mt-2">
          {book.author && (
            <div className="d-flex align-items-center gap-2 text-muted small" data-testid={`book-author-${book.id}`}>
              <User className="w-3 h-3" />
              <span>{book.author}</span>
            </div>
          )}
          {book.category && (
            <div className="d-flex align-items-center gap-2 text-muted small">
              <Tag className="w-3 h-3" />
              <span>{book.category}</span>
            </div>
          )}
        </div>

        <div className="d-flex align-items-center justify-content-between mt-3 pt-3 border-top">
          <div className="fw-bold fs-5 text-primary" data-testid={`book-price-${book.id}`}>
            {formatCurrency(book.unitPrice)}
          </div>
          <div className={cn(
            "badge rounded-pill px-2 py-1 small fw-bold text-uppercase",
            inStock ? "bg-success-subtle text-success" : "bg-danger-subtle text-danger"
          )} style={{ fontSize: '0.6rem', letterSpacing: '0.5px' }}>
            {inStock ? "In Stock" : "Out of Stock"}
          </div>
        </div>
      </div>

      <div className="mt-3">
        <button
          className="btn btn-primary pb-sheen w-100 d-flex align-items-center justify-content-center gap-2 py-2 fs-6 fw-bold shadow-sm"
          disabled={isPending || !inStock}
          onClick={() => onAdd(book)}
          data-testid={`add-to-cart-${book.id}`}
        >
          <ShoppingCart className="w-4 h-4" />
          {inStock ? "Add to Cart" : "Unavailable"}
        </button>
      </div>
    </GlassCard>
  );
}

export default function StoreCatalog() {
  const { data: books = [], isLoading, error } = useQuery<Book[]>({ queryKey: ["/api/books"] });
  const addToCart = useAddToCart();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  const categories = BOOK_CATEGORIES;

  const filtered = books.filter((b) => {
    const matchesSearch =
      !search ||
      b.title.toLowerCase().includes(search.toLowerCase()) ||
      (b.author ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (b.isbn ?? "").toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !categoryFilter || b.category === categoryFilter;
    return matchesSearch && matchesCategory && b.isActive;
  });

  const handleAdd = (book: Book) => {
    addToCart.mutate(
      { bookId: book.id },
      {
        onSuccess: () =>
          toast({ title: "Added to cart", description: `${book.title} has been added to your cart.` }),
        onError: (err: any) =>
          toast({ title: "Error", description: err.message || "Failed to add item", variant: "destructive" }),
      },
    );
  };

  return (
    <div>
      <SectionHeader
        title="Browse Catalog"
        subtitle="Explore our collection of educational and literature titles."
      />

      <GlassCard className="border-0 shadow-sm p-3 mb-4">
        <div className="row g-3">
          <div className="col-12 col-md-8">
            <div className="input-group input-group-lg bg-light rounded-4 overflow-hidden border-0">
              <span className="input-group-text bg-transparent border-0 ps-3">
                <Search className="w-5 h-5 text-muted" />
              </span>
              <input
                type="text"
                className="form-control border-0 bg-transparent py-3 shadow-none fw-medium"
                placeholder="Search by title, author, or ISBN…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                data-testid="store-search"
              />
              {search && (
                <button className="btn btn-link text-muted pe-3 text-decoration-none" onClick={() => setSearch("")}>
                  Clear
                </button>
              )}
            </div>
          </div>
          <div className="col-12 col-md-4">
            <div className="d-flex align-items-center h-100 bg-light rounded-4 px-3">
              <Filter className="w-4 h-4 text-muted shrink-0 me-2" />
              <select
                className="form-select border-0 bg-transparent shadow-none fw-medium py-3"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                data-testid="store-category-filter"
              >
                <option value="">All Categories</option>
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </GlassCard>

      {isLoading ? (
        <div className="row g-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <div key={i} className="col-sm-6 col-lg-4 col-xl-3">
              <GlassCard className="border-0 shadow-sm h-100">
                <div className="placeholder-glow">
                  <div className="placeholder col-12 rounded-4 mb-3" style={{ height: '140px' }} />
                  <div className="placeholder col-10 rounded-3 mb-2" style={{ height: '24px' }} />
                  <div className="placeholder col-6 rounded-3 mb-4" style={{ height: '18px' }} />
                  <div className="placeholder col-12 rounded-3" style={{ height: '40px' }} />
                </div>
              </GlassCard>
            </div>
          ))}
        </div>
      ) : error ? (
        <GlassCard className="border-danger/20 text-center py-5">
          <XCircle className="w-12 h-12 text-danger mx-auto mb-3 opacity-20" />
          <h5 className="fw-bold text-danger">Failed to load catalog</h5>
          <p className="text-secondary">{(error as Error).message}</p>
          <button className="btn btn-outline-danger mt-2 px-4" onClick={() => window.location.reload()}>Retry</button>
        </GlassCard>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="w-12 h-12 text-muted opacity-20" />}
          title="No results found"
          description="We couldn't find any books matching your search criteria."
          action={
            <button className="btn btn-outline-primary px-4 py-2" onClick={() => { setSearch(""); setCategoryFilter(""); }}>
              Reset Filters
            </button>
          }
        />
      ) : categoryFilter || search ? (
        <div className="row g-4">
          {filtered.map((book) => (
            <div key={book.id} className="col-sm-6 col-lg-4 col-xl-3" data-testid={`book-card-${book.id}`}>
              <BookCard book={book} onAdd={handleAdd} isPending={addToCart.isPending} />
            </div>
          ))}
        </div>
      ) : (
        <div className="vstack gap-5">
          {categories.map((cat) => {
            const catBooks = filtered.filter((b) => b.category === cat);
            if (catBooks.length === 0) return null;
            return (
              <div key={cat} data-testid={`store-category-section-${cat}`}>
                <div className="d-flex align-items-center justify-content-between mb-4">
                  <h4 className="fw-bold mb-0 d-flex align-items-center gap-2">
                    <span className="p-2 bg-primary-subtle rounded-3 text-primary d-inline-flex">
                      <Tag className="w-5 h-5" />
                    </span>
                    {cat}
                  </h4>
                  <span className="badge bg-light text-muted border px-3 py-2 fw-bold rounded-pill">
                    {catBooks.length} titles
                  </span>
                </div>
                <div className="row g-4">
                  {catBooks.map((book) => (
                    <div key={book.id} className="col-sm-6 col-lg-4 col-xl-3" data-testid={`book-card-${book.id}`}>
                      <BookCard book={book} onAdd={handleAdd} isPending={addToCart.isPending} />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {(() => {
            const uncategorized = filtered.filter((b) => !b.category || !categories.includes(b.category as any));
            if (uncategorized.length === 0) return null;
            return (
              <div data-testid="store-category-section-uncategorized">
                <div className="d-flex align-items-center justify-content-between mb-4">
                  <h4 className="fw-bold mb-0 d-flex align-items-center gap-2 text-muted">
                    <span className="p-2 bg-light rounded-3 text-muted d-inline-flex border">
                      <Tag className="w-5 h-5" />
                    </span>
                    Other Titles
                  </h4>
                  <span className="badge bg-light text-muted border px-3 py-2 fw-bold rounded-pill">
                    {uncategorized.length} titles
                  </span>
                </div>
                <div className="row g-4">
                  {uncategorized.map((book) => (
                    <div key={book.id} className="col-sm-6 col-lg-4 col-xl-3" data-testid={`book-card-${book.id}`}>
                      <BookCard book={book} onAdd={handleAdd} isPending={addToCart.isPending} />
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
