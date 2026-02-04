import { Switch, Route } from "wouter";
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
import { useMe } from "@/hooks/use-me";

function HomeGate() {
  const { data: me, isLoading } = useMe();

  if (isLoading) {
    return <Landing />;
  }

  if (!me) {
    return <Landing />;
  }

  return <Dashboard />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomeGate} />
      <Route path="/books" component={Books} />
      <Route path="/customers" component={Customers} />
      <Route path="/orders" component={OrdersList} />
      <Route path="/orders/new" component={OrderCreate} />
      <Route path="/orders/:id" component={OrderDetail} />
      <Route path="/payments" component={Payments} />
      <Route path="/users" component={Users} />

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
