import React from 'react';
import { DayPicker, DropdownProps } from 'react-day-picker';
import { id } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';

type CalendarProps = React.ComponentProps<typeof DayPicker> & {
  highlightedDays?: Date[];
};

function CalmyCalendar({
  className,
  classNames,
  showOutsideDays = true,
  highlightedDays = [],
  ...props
}: CalendarProps) {
  const highlightedModifiers = {
    highlighted: highlightedDays,
  };
  const highlightedModifiersStyles = {
    highlighted: {
      position: 'relative',
      color: 'var(--foreground)', // Change text color if needed, e.g., pink-600
    },
  };
  
  // Custom dot component to be appended
  const Dot = () => <div className="absolute bottom-1.5 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-pink-500" />;

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn('p-3', className)}
      classNames={{
        months: 'flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0',
        month: 'space-y-4',
        caption: 'flex justify-center pt-1 relative items-center',
        caption_label: 'text-sm font-medium',
        caption_dropdowns: 'flex gap-2',
        nav: 'space-x-1 flex items-center',
        nav_button: cn(
          buttonVariants({ variant: 'outline' }),
          'h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100'
        ),
        nav_button_previous: 'absolute left-1',
        nav_button_next: 'absolute right-1',
        table: 'w-full border-collapse space-y-1',
        head_row: 'flex',
        head_cell: 'text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]',
        row: 'flex w-full mt-2',
        cell: 'h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20',
        day: cn(
          buttonVariants({ variant: 'ghost' }),
          'h-9 w-9 p-0 font-normal aria-selected:opacity-100'
        ),
        day_selected:
          'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground',
        day_today: 'bg-accent text-accent-foreground',
        day_outside: 'text-muted-foreground opacity-50',
        day_disabled: 'text-muted-foreground opacity-50',
        day_range_middle: 'aria-selected:bg-accent aria-selected:text-accent-foreground',
        day_hidden: 'invisible',
        ...classNames,
      }}
      locale={id}
      modifiers={highlightedModifiers}
      modifiersClassNames={{ highlighted: 'has-dot' }} // Add a class for styling
      components={{
        IconLeft: ({ ...props }) => <ChevronLeft className="h-4 w-4" />,
        IconRight: ({ ...props }) => <ChevronRight className="h-4 w-4" />,
        DayContent: (dayProps) => {
          const isHighlighted = highlightedDays.some(
            (d) => format(d, 'yyyy-MM-dd') === format(dayProps.date, 'yyyy-MM-dd')
          );
          return (
            <div className="relative h-full w-full flex items-center justify-center">
              <span>{dayProps.date.getDate()}</span>
              {isHighlighted && <Dot />}
            </div>
          );
        },
        Dropdown: ({ value, onChange, children, ...props }: DropdownProps) => {
            const options = React.Children.toArray(children) as React.ReactElement<React.HTMLProps<HTMLOptionElement>>[];
            const selected = options.find((child) => child.props.value === value);
            const handleChange = (value: string) => {
              const changeEvent = {
                target: { value },
              } as React.ChangeEvent<HTMLSelectElement>;
              onChange?.(changeEvent);
            };
            return (
              <Select
                value={value?.toString()}
                onValueChange={(value) => {
                  handleChange(value);
                }}
              >
                <SelectTrigger className="pr-1.5 focus:ring-0">
                  <SelectValue>{selected?.props?.children}</SelectValue>
                </SelectTrigger>
                <SelectContent position="popper">
                  <SelectItem value="next">Next</SelectItem>
                  {options.map((option, id: number) => (
                    <SelectItem key={`${option.props.value}-${id}`} value={option.props.value?.toString() ?? ""}>
                      {option.props.children}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            );
        },
      }}
      {...props}
    />
  );
}
CalmyCalendar.displayName = 'CalmyCalendar';

export default CalmyCalendar;