import { useLocation } from 'wouter';
import { CheckCircle, Clock, AlertCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function PaymentConfirmed() {
  const [, setLocation] = useLocation();
  
  // Parse query params
  const params = new URLSearchParams(window.location.search);
  const isSuccess = params.get('success') === 'true';
  const isPending = params.get('pending') === 'true';
  
  const getStatus = () => {
    if (isSuccess) {
      return {
        icon: <CheckCircle className="h-16 w-16 text-green-500" />,
        title: 'Payment Successful!',
        message: 'Your fines have been paid successfully. Thank you for your payment.',
        color: 'text-green-600',
      };
    }
    if (isPending) {
      return {
        icon: <Clock className="h-16 w-16 text-yellow-500" />,
        title: 'Payment Processing',
        message: 'Your payment is being processed. Your fines will be marked as paid once the payment is confirmed.',
        color: 'text-yellow-600',
      };
    }
    return {
      icon: <AlertCircle className="h-16 w-16 text-gray-500" />,
      title: 'Payment Status Unknown',
      message: 'We could not determine your payment status. Please check your fines page for updates.',
      color: 'text-gray-600',
    };
  };
  
  const status = getStatus();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
            {status.icon}
          </div>
          <CardTitle className={`text-2xl ${status.color}`} data-testid="text-payment-status-title">
            {status.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          <p className="text-muted-foreground" data-testid="text-payment-status-message">
            {status.message}
          </p>
          
          <div className="flex flex-col gap-3">
            <Button 
              onClick={() => setLocation('/player/home')}
              className="w-full"
              data-testid="button-view-fines"
            >
              View My Fines
            </Button>
            <Button 
              variant="outline"
              onClick={() => setLocation('/player/home')}
              className="w-full"
              data-testid="button-go-home"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
