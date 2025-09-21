import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  CreditCard, 
  Download, 
  Plus,
  Check,
  Star,
  Calendar,
  DollarSign,
  Users,
  Zap,
  Shield,
  AlertCircle,
  ExternalLink
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Mock billing data
const mockPlan = {
  name: "Professional",
  price: 299,
  currency: "USD",
  frequency: "monthly",
  features: [
    "Up to 50 active job postings",
    "Unlimited candidate searches",
    "Advanced AI matching",
    "Pipeline management",
    "Custom reports & analytics",
    "Priority support"
  ],
  limits: {
    jobPostings: 50,
    candidates: "unlimited",
    users: 10
  }
};

const mockInvoices = [
  {
    id: "INV-2024-001",
    date: "2024-03-01",
    amount: 299,
    status: "paid",
    description: "Professional Plan - March 2024",
    downloadUrl: "#"
  },
  {
    id: "INV-2024-002",
    date: "2024-02-01",
    amount: 299,
    status: "paid",
    description: "Professional Plan - February 2024",
    downloadUrl: "#"
  },
  {
    id: "INV-2024-003",
    date: "2024-01-01",
    amount: 299,
    status: "paid",
    description: "Professional Plan - January 2024",
    downloadUrl: "#"
  }
];

const mockPaymentMethods = [
  {
    id: "pm_1",
    type: "card",
    brand: "visa",
    last4: "4242",
    expiryMonth: 12,
    expiryYear: 2025,
    isDefault: true
  }
];

const plans = [
  {
    name: "Starter",
    price: 99,
    currency: "USD",
    frequency: "monthly",
    description: "Perfect for small teams getting started",
    features: [
      "Up to 10 active job postings",
      "Basic candidate search",
      "Standard matching",
      "Basic pipeline management",
      "Email support"
    ],
    limits: {
      jobPostings: 10,
      candidates: 1000,
      users: 3
    },
    popular: false
  },
  {
    name: "Professional",
    price: 299,
    currency: "USD",
    frequency: "monthly",
    description: "Most popular for growing companies",
    features: [
      "Up to 50 active job postings",
      "Unlimited candidate searches",
      "Advanced AI matching",
      "Full pipeline management",
      "Custom reports & analytics",
      "Priority support"
    ],
    limits: {
      jobPostings: 50,
      candidates: "unlimited",
      users: 10
    },
    popular: true
  },
  {
    name: "Enterprise",
    price: 599,
    currency: "USD",
    frequency: "monthly",
    description: "For large organizations with complex needs",
    features: [
      "Unlimited job postings",
      "Unlimited candidate searches",
      "AI-powered matching & insights",
      "Advanced pipeline automation",
      "Custom integrations",
      "Dedicated account manager",
      "SLA guarantee"
    ],
    limits: {
      jobPostings: "unlimited",
      candidates: "unlimited",
      users: "unlimited"
    },
    popular: false
  }
];

export default function Billing() {
  const [isLoading, setIsLoading] = useState(false);
  const [isAddPaymentOpen, setIsAddPaymentOpen] = useState(false);

  const handlePlanChange = (planName: string) => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      toast.success(`Successfully upgraded to ${planName} plan!`);
    }, 2000);
  };

  const handleDownloadInvoice = (invoiceId: string) => {
    toast.success(`Downloading invoice ${invoiceId}...`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'default';
      case 'pending': return 'secondary';
      case 'overdue': return 'destructive';
      default: return 'outline';
    }
  };

  const PlanCard = ({ plan, isCurrent = false }: { plan: typeof plans[0], isCurrent?: boolean }) => (
    <Card className={`relative ${plan.popular ? 'border-primary shadow-lg' : ''} ${isCurrent ? 'ring-2 ring-primary' : ''}`}>
      {plan.popular && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <Badge className="bg-gradient-primary text-primary-foreground">
            <Star className="w-3 h-3 mr-1" />
            Most Popular
          </Badge>
        </div>
      )}
      
      <CardHeader className="text-center pb-4">
        <CardTitle className="text-xl">{plan.name}</CardTitle>
        <div className="text-3xl font-bold">
          ${plan.price}
          <span className="text-sm font-normal text-muted-foreground">/{plan.frequency}</span>
        </div>
        <CardDescription>{plan.description}</CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <ul className="space-y-2">
          {plan.features.map((feature, index) => (
            <li key={index} className="flex items-start">
              <Check className="w-4 h-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
              <span className="text-sm">{feature}</span>
            </li>
          ))}
        </ul>
        
        <div className="pt-4">
          {isCurrent ? (
            <Button className="w-full" disabled>
              Current Plan
            </Button>
          ) : (
            <Button 
              className="w-full" 
              variant={plan.popular ? "default" : "outline"}
              onClick={() => handlePlanChange(plan.name)}
              disabled={isLoading}
            >
              {isLoading ? "Upgrading..." : `Upgrade to ${plan.name}`}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const AddPaymentMethodDialog = () => (
    <Dialog open={isAddPaymentOpen} onOpenChange={setIsAddPaymentOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Payment Method</DialogTitle>
          <DialogDescription>
            Add a new credit card to your account
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="cardNumber">Card Number</Label>
            <Input id="cardNumber" placeholder="1234 5678 9012 3456" />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="expiry">Expiry Date</Label>
              <Input id="expiry" placeholder="MM/YY" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cvc">CVC</Label>
              <Input id="cvc" placeholder="123" />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="name">Cardholder Name</Label>
            <Input id="name" placeholder="John Doe" />
          </div>
        </div>

        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={() => setIsAddPaymentOpen(false)}>
            Cancel
          </Button>
          <Button onClick={() => {
            setIsAddPaymentOpen(false);
            toast.success("Payment method added successfully!");
          }}>
            Add Card
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Billing & Subscription</h1>
          <p className="text-muted-foreground">
            Manage your subscription, payment methods, and billing history
          </p>
        </div>
      </div>

      {/* Current Plan Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Current Plan
          </CardTitle>
          <CardDescription>
            Your current subscription details and usage
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div>
                <div className="text-2xl font-bold">{mockPlan.name}</div>
                <div className="text-muted-foreground">
                  ${mockPlan.price}/{mockPlan.frequency}
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Job Postings Used</span>
                  <span>23 / {mockPlan.limits.jobPostings}</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-primary h-2 rounded-full" style={{ width: '46%' }}></div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Team Members</span>
                  <span>7 / {mockPlan.limits.users}</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-primary h-2 rounded-full" style={{ width: '70%' }}></div>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Next billing date</span>
                <span className="font-medium">April 1, 2024</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Billing cycle</span>
                <span className="font-medium">Monthly</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Auto-renewal</span>
                <Badge variant="default">Enabled</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Available Plans */}
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">Available Plans</h2>
          <p className="text-muted-foreground">
            Choose the plan that best fits your hiring needs
          </p>
        </div>
        
        <div className="grid gap-6 md:grid-cols-3">
          {plans.map((plan) => (
            <PlanCard 
              key={plan.name} 
              plan={plan} 
              isCurrent={plan.name === mockPlan.name}
            />
          ))}
        </div>
      </div>

      {/* Payment Methods */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Payment Methods
              </CardTitle>
              <CardDescription>
                Manage your payment methods and billing information
              </CardDescription>
            </div>
            <Button onClick={() => setIsAddPaymentOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Payment Method
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockPaymentMethods.map((method) => (
              <div key={method.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded flex items-center justify-center">
                    <CreditCard className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <div className="font-medium">
                      •••• •••• •••• {method.last4}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Expires {method.expiryMonth}/{method.expiryYear}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {method.isDefault && (
                    <Badge variant="secondary">Default</Badge>
                  )}
                  <Button variant="outline" size="sm">
                    Edit
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Billing History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Billing History
          </CardTitle>
          <CardDescription>
            View and download your past invoices
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockInvoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">{invoice.id}</TableCell>
                  <TableCell>{new Date(invoice.date).toLocaleDateString()}</TableCell>
                  <TableCell>{invoice.description}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <DollarSign className="w-3 h-3 mr-1" />
                      {invoice.amount}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusColor(invoice.status)}>
                      {invoice.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleDownloadInvoice(invoice.id)}
                    >
                      <Download className="w-3 h-3 mr-1" />
                      Download
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Security Notice */}
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          Your payment information is secured with industry-standard encryption. 
          We never store your full credit card details on our servers.
        </AlertDescription>
      </Alert>

      <AddPaymentMethodDialog />
    </div>
  );
}