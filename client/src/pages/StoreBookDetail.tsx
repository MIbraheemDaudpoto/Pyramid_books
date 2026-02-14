import { useQuery } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import type { Book } from "@shared/schema";
import { useAddToCart } from "@/hooks/use-cart";
import { useToast } from "@/hooks/use-toast";
import GlassCard from "@/components/GlassCard";
import SectionHeader from "@/components/SectionHeader";
import Seo from "@/components/Seo";
import { ShoppingCart, BookOpen, User, Hash, Building, Tag, ArrowLeft, CheckCircle2, AlertCircle } from "lucide-react";
import { formatCurrency, cn } from "@/lib/utils";

export default function StoreBookDetail() {
    const { id } = useParams();
    const [, setLocation] = useLocation();
    const { toast } = useToast();
    const addToCart = useAddToCart();

    const { data: book, isLoading, error } = useQuery<Book>({
        queryKey: [`/api/books/${id}`],
        enabled: !!id,
    });

    if (isLoading) {
        return (
            <div className="d-flex align-items-center justify-content-center" style={{ minHeight: "50vh" }}>
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    if (error || !book) {
        return (
            <GlassCard className="text-center py-5">
                <AlertCircle className="w-12 h-12 text-danger mx-auto mb-3 opacity-20" />
                <h5 className="fw-bold text-danger">Book not found</h5>
                <button className="btn btn-primary mt-3" onClick={() => setLocation("/store")}>
                    Back to Catalog
                </button>
            </GlassCard>
        );
    }

    const inStock = book.stockQty != null && book.stockQty > 0;

    const handleAdd = () => {
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

    // Schema Markup for SEO
    const schemaMarkup = {
        "@context": "https://schema.org/",
        "@type": "Book",
        "name": book.title,
        "isbn": book.isbn,
        "author": {
            "@type": "Person",
            "name": book.author || "Unknown Author"
        },
        "publisher": {
            "@type": "Organization",
            "name": book.publisher || "Pyramid Books"
        },
        "description": book.description || "A premium book available at Pyramid Books.",
        "offers": {
            "@type": "Offer",
            "price": book.unitPrice,
            "priceCurrency": "PKR",
            "availability": inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock"
        }
    };

    return (
        <div>
            <Seo title={`${book.title} | Pyramid Books`} description={book.description?.substring(0, 160)} />

            <script type="application/ld+json">
                {JSON.stringify(schemaMarkup)}
            </script>

            <button
                className="btn btn-link text-muted d-flex align-items-center gap-2 mb-4 p-0 text-decoration-none hover:text-primary transition-colors"
                onClick={() => setLocation("/store")}
            >
                <ArrowLeft className="w-4 h-4" />
                Back to Catalog
            </button>

            <div className="row g-5">
                <div className="col-12 col-lg-5">
                    <div style={{ minHeight: '400px' }} className="h-100">
                        <GlassCard className="p-5 bg-white border-0 shadow-sm d-flex align-items-center justify-content-center h-100">
                            <BookOpen className="w-48 h-48 text-primary opacity-10" />
                        </GlassCard>
                    </div>
                </div>

                <div className="col-12 col-lg-7">
                    <div className="vstack gap-4">
                        <div>
                            <div className="d-flex align-items-center gap-2 mb-2">
                                <span className="badge rounded-pill bg-primary-subtle text-primary px-3 py-2 fw-bold text-uppercase" style={{ fontSize: '0.7rem' }}>
                                    {book.category || "General"}
                                </span>
                                <div className={cn(
                                    "badge rounded-pill px-3 py-2 fw-bold text-uppercase border",
                                    inStock ? "bg-success-subtle text-success border-success-subtle" : "bg-danger-subtle text-danger border-danger-subtle"
                                )} style={{ fontSize: '0.7rem' }}>
                                    {inStock ? "In Stock" : "Temporarily Out of Stock"}
                                </div>
                            </div>
                            <h1 className="display-5 fw-bold text-dark mb-2">{book.title}</h1>
                            <div className="d-flex flex-wrap gap-4 text-muted">
                                <div className="d-flex align-items-center gap-2">
                                    <User className="w-4 h-4" />
                                    <span className="fw-medium">{book.author || "Unknown Author"}</span>
                                </div>
                                {book.isbn && (
                                    <div className="d-flex align-items-center gap-2">
                                        <Hash className="w-4 h-4" />
                                        <span className="fw-medium">ISBN: {book.isbn}</span>
                                    </div>
                                )}
                                {book.publisher && (
                                    <div className="d-flex align-items-center gap-2">
                                        <Building className="w-4 h-4" />
                                        <span className="fw-medium">{book.publisher}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <GlassCard className="p-4 bg-light border-0">
                            <div className="d-flex align-items-center justify-content-between">
                                <div>
                                    <div className="text-muted small text-uppercase fw-bold mb-1">Our Price</div>
                                    <div className="display-6 fw-bold text-primary">{formatCurrency(book.unitPrice)}</div>
                                </div>
                                <button
                                    className="btn btn-primary pb-sheen btn-lg px-5 py-3 shadow-lg d-flex align-items-center gap-2 fw-bold"
                                    disabled={addToCart.isPending || !inStock}
                                    onClick={handleAdd}
                                >
                                    <ShoppingCart className="w-5 h-5" />
                                    {inStock ? "Add to Shopping Cart" : "Currently Unavailable"}
                                </button>
                            </div>
                        </GlassCard>

                        <div>
                            <h5 className="fw-bold mb-3 d-flex align-items-center gap-2">
                                <Tag className="w-5 h-5 text-primary" />
                                About this Book
                            </h5>
                            <p className="text-secondary fs-5 leading-relaxed">
                                {book.description || "No description available for this title at the moment."}
                            </p>
                        </div>

                        <div className="row g-3 mt-2">
                            <div className="col-12 col-md-4">
                                <div className="p-3 rounded-4 bg-white border d-flex items-center gap-3">
                                    <CheckCircle2 className="w-6 h-6 text-success" />
                                    <div>
                                        <div className="fw-bold small">Authentic Titles</div>
                                        <div className="text-muted smaller">100% Original Copies</div>
                                    </div>
                                </div>
                            </div>
                            <div className="col-12 col-md-4">
                                <div className="p-3 rounded-4 bg-white border d-flex items-center gap-3">
                                    <CheckCircle2 className="w-6 h-6 text-success" />
                                    <div>
                                        <div className="fw-bold small">Secure Payment</div>
                                        <div className="text-muted smaller">Safe & Protected</div>
                                    </div>
                                </div>
                            </div>
                            <div className="col-12 col-md-4">
                                <div className="p-3 rounded-4 bg-white border d-flex items-center gap-3">
                                    <CheckCircle2 className="w-6 h-6 text-success" />
                                    <div>
                                        <div className="fw-bold small">Fast Delivery</div>
                                        <div className="text-muted smaller">Countrywide Shipping</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
