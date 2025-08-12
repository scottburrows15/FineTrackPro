import { useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useFocusManagement, announceToScreenReader } from "@/lib/accessibility";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AccessibleModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  closeOnOutsideClick?: boolean;
  closeOnEscape?: boolean;
  className?: string;
}

export function AccessibleModal({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = 'md',
  closeOnOutsideClick = true,
  closeOnEscape = true,
  className = ""
}: AccessibleModalProps) {
  const { saveFocus, restoreFocus, trapFocus } = useFocusManagement();
  const modalRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (isOpen) {
      saveFocus();
      announceToScreenReader(`Modal opened: ${title}`, 'assertive');
      
      const cleanup = modalRef.current ? trapFocus(modalRef.current) : undefined;
      
      return () => {
        cleanup?.();
        restoreFocus();
        announceToScreenReader('Modal closed', 'polite');
      };
    }
  }, [isOpen, title, saveFocus, restoreFocus, trapFocus]);

  const handleClose = () => {
    if (closeOnEscape) {
      onClose();
    }
  };

  const handleOutsideClick = () => {
    if (closeOnOutsideClick) {
      onClose();
    }
  };

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl'
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        ref={modalRef}
        className={`
          ${sizeClasses[size]} 
          ${className}
          focus:outline-none
        `}
        onEscapeKeyDown={closeOnEscape ? onClose : undefined}
        onPointerDownOutside={handleOutsideClick}
        onInteractOutside={handleOutsideClick}
        aria-describedby={description ? "modal-description" : undefined}
      >
        <DialogHeader className="space-y-3">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold pr-8">
              {title}
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
              aria-label="Close modal"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          {description && (
            <DialogDescription id="modal-description" className="text-sm text-muted-foreground">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>
        
        <div className="mt-4">
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default AccessibleModal;