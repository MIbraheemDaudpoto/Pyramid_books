import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import Dashboard from "@/pages/Dashboard";
import Books from "@/pages/Books";
import Customers from "@/pages/Customers";
import OrdersList from "@/pages/OrdersList";
import OrderCreate from "@/pages/OrderCreate";
import OrderDetail from "@/pages/OrderDetail";
import Payments from "@/pages/Payments";
import Users from "@/pages/Users";
import StockReceipts from "@/pages/StockReceipts";
import Reports from "@/pages/Reports";
import CsvImportExport from "@/pages/CsvImportExport";
import DiscountRules from "@/pages/DiscountRules";
import Messages from "@/pages/Messages";
import RequireRole from "@/components/RequireRole";
import CustomerLayout from "@/components/CustomerLayout";
import StoreCatalog from "@/pages/StoreCatalog";
import StoreCart from "@/pages/StoreCart";
import StoreOrders from "@/pages/StoreOrders";
import StorePayments from "@/pages/StorePayments";
import StoreProfile from "@/pages/StoreProfile";
import StoreSchoolLists from "@/pages/StoreSchoolLists";
import StoreOrderDetail from "@/pages/StoreOrderDetail";
import { useMe } from "@/hooks/use-me";

function HomeGate() {
  const { data: me, isLoading } = useMe();

  if (isLoading) {
    return (
      <div className="d-flex align-items-center justify-content-center" style={{ minHeight: "100vh" }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!me) {
    return <Landing />;
  }

  if (me.role === "customer") {
    return <Redirect to="/store" />;
  }

  return <Dashboard />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomeGate} />
      <Route path="/login" component={Login} />
      <Route path="/signup" component={Signup} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset-password" component={ResetPassword} />

      {/* Admin/Salesman Routes */}
      <Route path="/dashboard">
        <RequireRole roles={["admin", "salesman"]}>
          <Dashboard />
        </RequireRole>
      </Route>
      <Route path="/books">
        <RequireRole roles={["admin", "salesman"]}>
          <Books />
        </RequireRole>
      </Route>
      <Route path="/customers">
        <RequireRole roles={["admin", "salesman"]}>
          <Customers />
        </RequireRole>
      </Route>
      <Route path="/orders/new">
        <RequireRole roles={["admin", "salesman"]}>
          <OrderCreate />
        </RequireRole>
      </Route>
      <Route path="/orders/:id">
        <RequireRole roles={["admin", "salesman"]}>
          <OrderDetail />
        </RequireRole>
      </Route>
      <Route path="/orders">
        <RequireRole roles={["admin", "salesman"]}>
          <OrdersList />
        </RequireRole>
      </Route>
      <Route path="/payments">
        <RequireRole roles={["admin", "salesman"]}>
          <Payments />
        </RequireRole>
      </Route>
      <Route path="/users">
        <RequireRole roles={["admin"]}>
          <Users />
        </RequireRole>
      </Route>
      <Route path="/stock">
        <RequireRole roles={["admin", "salesman"]}>
          <StockReceipts />
        </RequireRole>
      </Route>
      <Route path="/reports">
        <RequireRole roles={["admin", "salesman"]}>
          <Reports />
        </RequireRole>
      </Route>
      <Route path="/csv">
        <RequireRole roles={["admin", "salesman"]}>
          <CsvImportExport />
        </RequireRole>
      </Route>
      <Route path="/discounts">
        <RequireRole roles={["admin"]}>
          <DiscountRules />
        </RequireRole>
      </Route>

      {/* Customer Routes */}
      <Route path="/store">
        <RequireRole roles={["customer"]}>
          <CustomerLayout><StoreCatalog /></CustomerLayout>
        </RequireRole>
      </Route>
      <Route path="/store/cart">
        <RequireRole roles={["customer"]}>
          <CustomerLayout><StoreCart /></CustomerLayout>
        </RequireRole>
      </Route>
      <Route path="/store/orders">
        <RequireRole roles={["customer"]}>
          <CustomerLayout><StoreOrders /></CustomerLayout>
        </RequireRole>
      </Route>
      <Route path="/store/orders/:id">
        <RequireRole roles={["customer"]}>
          <CustomerLayout><StoreOrderDetail /></CustomerLayout>
        </RequireRole>
      </Route>
      <Route path="/store/payments">
        <RequireRole roles={["customer"]}>
          <CustomerLayout><StorePayments /></CustomerLayout>
        </RequireRole>
      </Route>
      <Route path="/store/profile">
        <RequireRole roles={["customer"]}>
          <CustomerLayout><StoreProfile /></CustomerLayout>
        </RequireRole>
      </Route>
      <Route path="/store/school-lists">
        <RequireRole roles={["customer"]}>
          <CustomerLayout><StoreSchoolLists /></CustomerLayout>
        </RequireRole>
      </Route>
      <Route path="/store/messages">
        <RequireRole roles={["customer"]}>
          <CustomerLayout><Messages /></CustomerLayout>
        </RequireRole>
      </Route>

      <Route path="/messages">
        <RequireRole roles={["admin", "salesman"]}>
          <Messages />
        </RequireRole>
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
