import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface GlassInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  icon?: React.ReactNode;
}

const GlassInput = React.forwardRef<HTMLInputElement, GlassInputProps>(
  ({ className, label, error, icon, ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    const [hasValue, setHasValue] = useState(false);

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setHasValue(!!e.target.value);
      setIsFocused(false);
      props.onBlur?.(e);
    };

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      props.onFocus?.(e);
    };
    
    // Check initial value
    React.useEffect(() => {
        if (props.value || props.defaultValue) {
            setHasValue(true);
        }
    }, [props.value, props.defaultValue]);

    return (
      <div className={cn("relative w-full group", className)}>
        <div className={cn(
            "relative flex items-center w-full rounded-xl transition-all duration-300",
            "bg-glass-bg border border-glass-border",
            "hover:border-white/20 hover:bg-glass-bg/80",
            isFocused && "border-primary/50 ring-2 ring-primary/20 bg-glass-bg/90",
            error && "border-destructive/50 ring-destructive/20"
        )}>
          {icon && (
            <div className="pl-4 text-muted-foreground">
              {icon}
            </div>
          )}
          
          <input
            ref={ref}
            {...props}
            className={cn(
              "w-full bg-transparent px-4 py-3.5 pt-5 pb-2 outline-none text-foreground placeholder:text-transparent transition-all",
              icon ? "pl-2" : ""
            )}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onChange={(e) => {
                setHasValue(!!e.target.value);
                props.onChange?.(e);
            }}
          />

          <label
            className={cn(
              "absolute left-4 transition-all duration-200 pointer-events-none text-muted-foreground/70",
              icon ? "left-10" : "",
              (isFocused || hasValue) 
                ? "top-1 text-[10px] uppercase tracking-wider text-primary font-semibold" 
                : "top-3.5 text-sm"
            )}
          >
            {label}
          </label>
        </div>
        
        {error && (
            <motion.p 
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-[11px] text-destructive mt-1 ml-2 font-medium"
            >
                {error}
            </motion.p>
        )}
      </div>
    );
  }
);

GlassInput.displayName = 'GlassInput';

export { GlassInput };
