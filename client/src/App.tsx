import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/Landing";
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
import { useMe } from "@/hooks/use-me";

function HomeGate() {
  const { data: me, isLoading } = useMe();

  if (isLoading) {
    return <Landing />;
  }

  if (!me) {
    return <Landing />;
  }

  if (me.role === "fixed_customer" || me.role === "local_customer") {
    return <Redirect to="/store" />;
  }

  return <Dashboard />;
}

function AdminRoutes() {
  return (
    <RequireRole roles={["super_admin", "salesman"]}>
      <Switch>
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/books" component={Books} />
        <Route path="/customers" component={Customers} />
        <Route path="/orders" component={OrdersList} />
        <Route path="/orders/new" component={OrderCreate} />
        <Route path="/orders/:id" component={OrderDetail} />
        <Route path="/payments" component={Payments} />
        <Route path="/users">
          <RequireRole roles={["super_admin"]}>
            <Users />
          </RequireRole>
        </Route>
        <Route path="/stock" component={StockReceipts} />
        <Route path="/reports" component={Reports} />
        <Route path="/csv">
          <RequireRole roles={["super_admin"]}>
            <CsvImportExport />
          </RequireRole>
        </Route>
        <Route path="/discounts">
          <RequireRole roles={["super_admin"]}>
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
    <RequireRole roles={["fixed_customer", "local_customer"]}>
      <CustomerLayout>
        <Switch>
          <Route path="/store" component={StoreCatalog} />
          <Route path="/store/cart" component={StoreCart} />
          <Route path="/store/orders" component={StoreOrders} />
          <Route path="/store/orders/:id" component={OrderDetail} />
          <Route path="/store/payments" component={StorePayments} />
          <Route path="/store/profile">
            <div className="text-center py-5">
              <h4>My Account</h4>
              <p className="text-muted">Account details coming soon.</p>
            </div>
          </Route>
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
