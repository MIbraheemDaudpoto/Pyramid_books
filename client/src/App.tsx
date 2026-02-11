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

function AdminRoutes() {
  return (
    <RequireRole roles={["admin", "salesman"]}>
      <Switch>
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/books" component={Books} />
        <Route path="/customers" component={Customers} />
        <Route path="/orders" component={OrdersList} />
        <Route path="/orders/new" component={OrderCreate} />
        <Route path="/orders/:id" component={OrderDetail} />
        <Route path="/payments" component={Payments} />
        <Route path="/users">
          <RequireRole roles={["admin"]}>
            <Users />
          </RequireRole>
        </Route>
        <Route path="/stock" component={StockReceipts} />
        <Route path="/reports" component={Reports} />
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
        <Route component={NotFound} />
      </Switch>
    </RequireRole>
  );
}

function CustomerRoutes() {
  return (
    <RequireRole roles={["customer"]}>
      <CustomerLayout>
        <Switch>
          <Route path="/store" component={StoreCatalog} />
          <Route path="/store/cart" component={StoreCart} />
          <Route path="/store/orders" component={StoreOrders} />
          <Route path="/store/orders/:id" component={StoreOrderDetail} />
          <Route path="/store/payments" component={StorePayments} />
          <Route path="/store/profile" component={StoreProfile} />
          <Route path="/store/school-lists" component={StoreSchoolLists} />
          <Route component={NotFound} />
        </Switch>
      </CustomerLayout>
    </RequireRole>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomeGate} />
      <Route path="/login" component={Login} />
      <Route path="/signup" component={Signup} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route path="/store/:rest*" component={CustomerRoutes} />
      <Route path="/store" component={CustomerRoutes} />
      <Route path="/:rest*" component={AdminRoutes} />
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
