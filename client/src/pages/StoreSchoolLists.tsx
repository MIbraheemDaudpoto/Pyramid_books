import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Book } from "@shared/schema";
import GlassCard from "@/components/GlassCard";
import SectionHeader from "@/components/SectionHeader";
import {
  GraduationCap,
  Plus,
  Trash2,
  Edit2,
  ShoppingCart,
  BookOpen,
  Search,
  Save,
  X,
  ChevronDown,
  ChevronRight,
  FileText,
  Minus,
} from "lucide-react";

interface SchoolListItem {
  id: number;
  listId: number;
  bookId: number;
  qty: number;
  notes: string | null;
  addedAt: string;
  book: {
    id: number;
    title: string;
    isbn: string | null;
    author: string | null;
    unitPrice: string;
  };
}

interface SchoolList {
  id: number;
  userId: string;
  name: string;
  schoolName: string | null;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  items: SchoolListItem[];
}

export default function StoreSchoolLists() {
  const { data: lists = [], isLoading } = useQuery<SchoolList[]>({
    queryKey: ["/api/school-lists"],
  });
  const { data: books = [] } = useQuery<Book[]>({ queryKey: ["/api/books"] });

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingListId, setEditingListId] = useState<number | null>(null);
  const [expandedListId, setExpandedListId] = useState<number | null>(null);
  const [addBookListId, setAddBookListId] = useState<number | null>(null);
  const [bookSearch, setBookSearch] = useState("");

  const [formName, setFormName] = useState("");
  const [formSchoolName, setFormSchoolName] = useState("");
  const [formDescription, setFormDescription] = useState("");

  const [alert, setAlert] = useState<{ type: string; msg: string } | null>(null);

  const createList = useMutation({
    mutationFn: async (data: { name: string; schoolName?: string; description?: string }) => {
      const res = await apiRequest("POST", "/api/school-lists", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/school-lists"] });
      setShowCreateForm(false);
      resetForm();
      setAlert({ type: "success", msg: "School list created successfully!" });
    },
    onError: (err: any) => setAlert({ type: "danger", msg: err.message || "Failed to create list" }),
  });

  const updateList = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await apiRequest("PATCH", `/api/school-lists/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/school-lists"] });
      setEditingListId(null);
      resetForm();
      setAlert({ type: "success", msg: "List updated!" });
    },
    onError: (err: any) => setAlert({ type: "danger", msg: err.message || "Failed to update list" }),
  });

  const deleteList = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/school-lists/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/school-lists"] });
      setAlert({ type: "success", msg: "List deleted." });
    },
    onError: (err: any) => setAlert({ type: "danger", msg: err.message || "Failed to delete list" }),
  });

  const addItem = useMutation({
    mutationFn: async ({ listId, bookId, qty }: { listId: number; bookId: number; qty: number }) => {
      const res = await apiRequest("POST", `/api/school-lists/${listId}/items`, { bookId, qty });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/school-lists"] });
      setAlert({ type: "success", msg: "Book added to list!" });
    },
    onError: (err: any) => setAlert({ type: "danger", msg: err.message || "Failed to add book" }),
  });

  const updateItem = useMutation({
    mutationFn: async ({ listId, itemId, data }: { listId: number; itemId: number; data: any }) => {
      const res = await apiRequest("PATCH", `/api/school-lists/${listId}/items/${itemId}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/school-lists"] });
    },
    onError: (err: any) => setAlert({ type: "danger", msg: err.message || "Failed to update item" }),
  });

  const removeItem = useMutation({
    mutationFn: async ({ listId, itemId }: { listId: number; itemId: number }) => {
      const res = await apiRequest("DELETE", `/api/school-lists/${listId}/items/${itemId}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/school-lists"] });
    },
    onError: (err: any) => setAlert({ type: "danger", msg: err.message || "Failed to remove item" }),
  });

  const addToCart = useMutation({
    mutationFn: async (listId: number) => {
      const res = await apiRequest("POST", `/api/school-lists/${listId}/add-to-cart`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      setAlert({ type: "success", msg: "All items from this list have been added to your cart!" });
    },
    onError: (err: any) => setAlert({ type: "danger", msg: err.message || "Failed to add to cart" }),
  });

  function resetForm() {
    setFormName("");
    setFormSchoolName("");
    setFormDescription("");
  }

  function startEdit(list: SchoolList) {
    setEditingListId(list.id);
    setFormName(list.name);
    setFormSchoolName(list.schoolName || "");
    setFormDescription(list.description || "");
    setShowCreateForm(false);
  }

  function handleCreateSubmit(e: any) {
    e.preventDefault();
    createList.mutate({
      name: formName,
      schoolName: formSchoolName || undefined,
      description: formDescription || undefined,
    });
  }

  function handleEditSubmit(e: any) {
    e.preventDefault();
    if (!editingListId) return;
    updateList.mutate({
      id: editingListId,
      data: {
        name: formName,
        schoolName: formSchoolName || null,
        description: formDescription || null,
      },
    });
  }

  const activeBooks = books.filter((b) => b.isActive);
  const filteredBooks = activeBooks.filter(
    (b) =>
      !bookSearch ||
      b.title.toLowerCase().includes(bookSearch.toLowerCase()) ||
      (b.author ?? "").toLowerCase().includes(bookSearch.toLowerCase()) ||
      (b.isbn ?? "").toLowerCase().includes(bookSearch.toLowerCase()),
  );

  if (isLoading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status" />
        <p className="mt-2 text-muted">Loading school lists...</p>
      </div>
    );
  }

  return (
    <div>
      <SectionHeader
        title="School Lists"
        subtitle="Create and manage book lists for schools and institutions"
      />

      {alert && (
        <div className={`alert alert-${alert.type} alert-dismissible fade show`} role="alert" data-testid="alert-message">
          {alert.msg}
          <button type="button" className="btn-close" onClick={() => setAlert(null)} />
        </div>
      )}

      <div className="d-flex justify-content-end mb-3">
        <button
          className="btn btn-primary d-flex align-items-center gap-2"
          onClick={() => {
            setShowCreateForm(true);
            setEditingListId(null);
            resetForm();
          }}
          data-testid="button-create-list"
        >
          <Plus style={{ width: 16, height: 16 }} />
          New School List
        </button>
      </div>

      {showCreateForm && (
        <GlassCard className="mb-4 pb-enter">
          <h5 className="mb-3 d-flex align-items-center gap-2">
            <GraduationCap style={{ width: 20, height: 20 }} className="text-primary" />
            Create New School List
          </h5>
          <form onSubmit={handleCreateSubmit}>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label fw-semibold">List Name *</label>
                <input
                  type="text"
                  className="form-control"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Grade 5 Reading List"
                  required
                  data-testid="input-list-name"
                />
              </div>
              <div className="col-md-6">
                <label className="form-label fw-semibold">School Name</label>
                <input
                  type="text"
                  className="form-control"
                  value={formSchoolName}
                  onChange={(e) => setFormSchoolName(e.target.value)}
                  placeholder="e.g. Springfield Elementary"
                  data-testid="input-school-name"
                />
              </div>
              <div className="col-12">
                <label className="form-label fw-semibold">Description</label>
                <textarea
                  className="form-control"
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Optional notes about this list..."
                  data-testid="input-list-description"
                />
              </div>
            </div>
            <div className="d-flex gap-2 mt-3">
              <button type="submit" className="btn btn-primary d-flex align-items-center gap-2" disabled={createList.isPending} data-testid="button-save-list">
                {createList.isPending ? <span className="spinner-border spinner-border-sm" /> : <Save style={{ width: 16, height: 16 }} />}
                Create List
              </button>
              <button type="button" className="btn btn-outline-secondary" onClick={() => { setShowCreateForm(false); resetForm(); }}>
                Cancel
              </button>
            </div>
          </form>
        </GlassCard>
      )}

      {lists.length === 0 && !showCreateForm ? (
        <GlassCard className="text-center py-5">
          <GraduationCap style={{ width: 48, height: 48 }} className="text-muted mb-3" />
          <h5>No School Lists Yet</h5>
          <p className="text-muted mb-3">
            Create a school list to organize book orders for your school or institution.
          </p>
          <button
            className="btn btn-primary"
            onClick={() => { setShowCreateForm(true); resetForm(); }}
            data-testid="button-create-first-list"
          >
            Create Your First List
          </button>
        </GlassCard>
      ) : (
        <div className="d-flex flex-column gap-3">
          {lists.map((list) => (
            <GlassCard key={list.id} className="pb-sheen">
              {editingListId === list.id ? (
                <form onSubmit={handleEditSubmit}>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">List Name *</label>
                      <input type="text" className="form-control" value={formName} onChange={(e) => setFormName(e.target.value)} required data-testid="input-edit-list-name" />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">School Name</label>
                      <input type="text" className="form-control" value={formSchoolName} onChange={(e) => setFormSchoolName(e.target.value)} data-testid="input-edit-school-name" />
                    </div>
                    <div className="col-12">
                      <label className="form-label fw-semibold">Description</label>
                      <textarea className="form-control" rows={2} value={formDescription} onChange={(e) => setFormDescription(e.target.value)} data-testid="input-edit-description" />
                    </div>
                  </div>
                  <div className="d-flex gap-2 mt-3">
                    <button type="submit" className="btn btn-primary btn-sm d-flex align-items-center gap-1" disabled={updateList.isPending} data-testid="button-update-list">
                      {updateList.isPending ? <span className="spinner-border spinner-border-sm" /> : <Save style={{ width: 14, height: 14 }} />}
                      Save
                    </button>
                    <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => { setEditingListId(null); resetForm(); }}>
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="d-flex justify-content-between align-items-start flex-wrap gap-2">
                    <div
                      className="d-flex align-items-center gap-2 flex-grow-1"
                      style={{ cursor: "pointer" }}
                      onClick={() => setExpandedListId(expandedListId === list.id ? null : list.id)}
                      data-testid={`list-header-${list.id}`}
                    >
                      {expandedListId === list.id ? (
                        <ChevronDown style={{ width: 18, height: 18 }} className="text-primary" />
                      ) : (
                        <ChevronRight style={{ width: 18, height: 18 }} className="text-muted" />
                      )}
                      <GraduationCap style={{ width: 20, height: 20 }} className="text-primary" />
                      <div>
                        <h6 className="mb-0" data-testid={`list-name-${list.id}`}>{list.name}</h6>
                        <small className="text-muted">
                          {list.schoolName && <span>{list.schoolName} · </span>}
                          {list.items.length} book{list.items.length !== 1 ? "s" : ""}
                        </small>
                      </div>
                    </div>
                    <div className="d-flex gap-1 flex-wrap">
                      <button
                        className="btn btn-outline-primary btn-sm d-flex align-items-center gap-1"
                        onClick={() => { setAddBookListId(addBookListId === list.id ? null : list.id); setBookSearch(""); }}
                        data-testid={`button-add-book-${list.id}`}
                      >
                        <Plus style={{ width: 14, height: 14 }} />
                        Add Book
                      </button>
                      <button
                        className="btn btn-success btn-sm d-flex align-items-center gap-1"
                        onClick={() => addToCart.mutate(list.id)}
                        disabled={addToCart.isPending || list.items.length === 0}
                        title="Add all books to cart"
                        data-testid={`button-add-to-cart-${list.id}`}
                      >
                        <ShoppingCart style={{ width: 14, height: 14 }} />
                        Add All to Cart
                      </button>
                      <button
                        className="btn btn-outline-secondary btn-sm"
                        onClick={() => startEdit(list)}
                        data-testid={`button-edit-list-${list.id}`}
                      >
                        <Edit2 style={{ width: 14, height: 14 }} />
                      </button>
                      <button
                        className="btn btn-outline-danger btn-sm"
                        onClick={() => { if (confirm("Delete this school list?")) deleteList.mutate(list.id); }}
                        data-testid={`button-delete-list-${list.id}`}
                      >
                        <Trash2 style={{ width: 14, height: 14 }} />
                      </button>
                    </div>
                  </div>

                  {list.description && (
                    <p className="text-muted small mt-2 mb-0">
                      <FileText style={{ width: 14, height: 14 }} className="me-1" />
                      {list.description}
                    </p>
                  )}

                  {addBookListId === list.id && (
                    <div className="mt-3 p-3 border rounded pb-enter" data-testid={`add-book-panel-${list.id}`}>
                      <h6 className="mb-2 d-flex align-items-center gap-2">
                        <BookOpen style={{ width: 16, height: 16 }} className="text-primary" />
                        Add Books to List
                      </h6>
                      <div className="position-relative mb-3">
                        <Search className="position-absolute text-muted" style={{ width: 16, height: 16, left: 12, top: "50%", transform: "translateY(-50%)" }} />
                        <input
                          type="text"
                          className="form-control"
                          style={{ paddingLeft: 36 }}
                          placeholder="Search books by title, author, or ISBN..."
                          value={bookSearch}
                          onChange={(e) => setBookSearch(e.target.value)}
                          data-testid="input-book-search"
                        />
                      </div>
                      <div style={{ maxHeight: 300, overflowY: "auto" }}>
                        {filteredBooks.length === 0 ? (
                          <p className="text-muted text-center py-3">No books found</p>
                        ) : (
                          <div className="list-group list-group-flush">
                            {filteredBooks.slice(0, 20).map((book) => {
                              const alreadyInList = list.items.some((i) => i.bookId === book.id);
                              return (
                                <div key={book.id} className="list-group-item d-flex justify-content-between align-items-center gap-2 px-2 py-2">
                                  <div className="flex-grow-1">
                                    <div className="fw-medium" style={{ fontSize: 14 }}>{book.title}</div>
                                    <small className="text-muted">
                                      {book.author && <span>{book.author} · </span>}
                                      {book.isbn && <span>ISBN: {book.isbn} · </span>}
                                      EGP {Number(book.unitPrice).toFixed(2)}
                                    </small>
                                  </div>
                                  <button
                                    className={`btn btn-sm ${alreadyInList ? "btn-outline-secondary" : "btn-outline-primary"} d-flex align-items-center gap-1`}
                                    onClick={() => addItem.mutate({ listId: list.id, bookId: book.id, qty: 1 })}
                                    disabled={addItem.isPending}
                                    data-testid={`button-add-book-item-${book.id}`}
                                  >
                                    <Plus style={{ width: 14, height: 14 }} />
                                    {alreadyInList ? "+1" : "Add"}
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                      <div className="text-end mt-2">
                        <button className="btn btn-sm btn-outline-secondary" onClick={() => setAddBookListId(null)}>
                          Close
                        </button>
                      </div>
                    </div>
                  )}

                  {expandedListId === list.id && (
                    <div className="mt-3 pb-enter">
                      {list.items.length === 0 ? (
                        <div className="text-center py-3 text-muted">
                          <BookOpen style={{ width: 32, height: 32 }} className="mb-2" />
                          <p className="mb-0">No books in this list yet. Click "Add Book" to get started.</p>
                        </div>
                      ) : (
                        <div className="table-responsive">
                          <table className="table table-sm align-middle mb-0">
                            <thead className="table-light">
                              <tr>
                                <th>Book</th>
                                <th style={{ width: 140 }}>Qty</th>
                                <th style={{ width: 100 }} className="text-end">Unit Price</th>
                                <th style={{ width: 100 }} className="text-end">Subtotal</th>
                                <th style={{ width: 50 }} />
                              </tr>
                            </thead>
                            <tbody>
                              {list.items.map((item) => (
                                <tr key={item.id} data-testid={`list-item-${item.id}`}>
                                  <td>
                                    <div className="fw-medium" style={{ fontSize: 14 }}>{item.book.title}</div>
                                    <small className="text-muted">
                                      {item.book.author && <span>{item.book.author}</span>}
                                      {item.book.isbn && <span> · {item.book.isbn}</span>}
                                    </small>
                                  </td>
                                  <td>
                                    <div className="d-flex align-items-center gap-1">
                                      <button
                                        className="btn btn-outline-secondary btn-sm"
                                        style={{ padding: "2px 6px" }}
                                        onClick={() => {
                                          if (item.qty <= 1) {
                                            removeItem.mutate({ listId: list.id, itemId: item.id });
                                          } else {
                                            updateItem.mutate({ listId: list.id, itemId: item.id, data: { qty: item.qty - 1 } });
                                          }
                                        }}
                                        data-testid={`button-decrease-${item.id}`}
                                      >
                                        <Minus style={{ width: 12, height: 12 }} />
                                      </button>
                                      <span className="mx-2 fw-medium" style={{ minWidth: 24, textAlign: "center" }} data-testid={`item-qty-${item.id}`}>
                                        {item.qty}
                                      </span>
                                      <button
                                        className="btn btn-outline-secondary btn-sm"
                                        style={{ padding: "2px 6px" }}
                                        onClick={() => updateItem.mutate({ listId: list.id, itemId: item.id, data: { qty: item.qty + 1 } })}
                                        data-testid={`button-increase-${item.id}`}
                                      >
                                        <Plus style={{ width: 12, height: 12 }} />
                                      </button>
                                    </div>
                                  </td>
                                  <td className="text-end">EGP {Number(item.book.unitPrice).toFixed(2)}</td>
                                  <td className="text-end fw-medium">EGP {(Number(item.book.unitPrice) * item.qty).toFixed(2)}</td>
                                  <td className="text-end">
                                    <button
                                      className="btn btn-outline-danger btn-sm"
                                      style={{ padding: "2px 6px" }}
                                      onClick={() => removeItem.mutate({ listId: list.id, itemId: item.id })}
                                      data-testid={`button-remove-item-${item.id}`}
                                    >
                                      <Trash2 style={{ width: 12, height: 12 }} />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                            <tfoot>
                              <tr className="fw-bold">
                                <td>Total</td>
                                <td>{list.items.reduce((s, i) => s + i.qty, 0)} items</td>
                                <td />
                                <td className="text-end">
                                  EGP {list.items.reduce((s, i) => s + Number(i.book.unitPrice) * i.qty, 0).toFixed(2)}
                                </td>
                                <td />
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}
