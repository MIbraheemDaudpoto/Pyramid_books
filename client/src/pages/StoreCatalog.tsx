import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Book } from "@shared/schema";
import { useAddToCart } from "@/hooks/use-cart";
import { useToast } from "@/hooks/use-toast";
import GlassCard from "@/components/GlassCard";
import SectionHeader from "@/components/SectionHeader";
import { Search, ShoppingCart, BookOpen, Filter } from "lucide-react";

export default function StoreCatalog() {
  const { data: books = [], isLoading } = useQuery<Book[]>({ queryKey: ["/api/books"] });
  const addToCart = useAddToCart();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  const categories = Array.from(new Set(books.map((b) => b.category).filter(Boolean))).sort();

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
      <SectionHeader title="Browse Books" subtitle="Find and order books from our catalog" />

      <GlassCard className="mb-4">
        <div className="d-flex flex-wrap gap-3 align-items-center">
          <div className="position-relative flex-grow-1" style={{ minWidth: 200 }}>
            <Search
              className="position-absolute text-muted"
              style={{ width: 16, height: 16, left: 12, top: "50%", transform: "translateY(-50%)" }}
            />
            <input
              type="text"
              className="form-control ps-5"
              placeholder="Search by title, author, or ISBN..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              data-testid="store-search"
            />
          </div>
          <div className="d-flex align-items-center gap-2">
            <Filter className="text-muted" style={{ width: 16, height: 16 }} />
            <select
              className="form-select"
              style={{ width: "auto" }}
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              data-testid="store-category-filter"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c!}>{c}</option>
              ))}
            </select>
          </div>
        </div>
      </GlassCard>

      {isLoading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <GlassCard className="text-center py-5">
          <BookOpen className="text-muted mx-auto mb-3" style={{ width: 48, height: 48 }} />
          <h5 className="text-muted">No books found</h5>
          <p className="text-muted small">Try adjusting your search or filter.</p>
        </GlassCard>
      ) : (
        <div className="row g-3">
          {filtered.map((book) => (
            <div key={book.id} className="col-sm-6 col-lg-4 col-xl-3" data-testid={`book-card-${book.id}`}>
              <GlassCard className="h-100 d-flex flex-column">
                <div className="flex-grow-1">
                  <h6 className="fw-bold mb-1" data-testid={`book-title-${book.id}`}>{book.title}</h6>
                  {book.author && (
                    <p className="text-muted small mb-1" data-testid={`book-author-${book.id}`}>
                      by {book.author}
                    </p>
                  )}
                  {book.category && (
                    <span className="badge bg-primary bg-opacity-10 text-primary small mb-2">
                      {book.category}
                    </span>
                  )}
                  {book.isbn && <p className="text-muted small mb-1">ISBN: {book.isbn}</p>}
                  {book.publisher && <p className="text-muted small mb-2">Publisher: {book.publisher}</p>}

                  <div className="d-flex align-items-center justify-content-between gap-2 mt-2">
                    <span className="fw-bold fs-5 text-primary" data-testid={`book-price-${book.id}`}>
                      ${Number(book.unitPrice).toFixed(2)}
                    </span>
                    {book.stockQty != null && book.stockQty > 0 ? (
                      <span className="badge bg-success bg-opacity-10 text-success small" data-testid={`book-stock-${book.id}`}>
                        {book.stockQty} in stock
                      </span>
                    ) : (
                      <span className="badge bg-danger bg-opacity-10 text-danger small">Out of stock</span>
                    )}
                  </div>
                </div>

                <div className="mt-3">
                  <button
                    className="btn btn-primary pb-sheen w-100 d-flex align-items-center justify-content-center gap-2"
                    disabled={!book.stockQty || book.stockQty <= 0 || addToCart.isPending}
                    onClick={() => handleAdd(book)}
                    data-testid={`add-to-cart-${book.id}`}
                  >
                    <ShoppingCart style={{ width: 16, height: 16 }} />
                    Add to Cart
                  </button>
                </div>
              </GlassCard>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
