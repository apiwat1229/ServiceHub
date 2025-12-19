import { Check, ChevronsUpDown, X } from 'lucide-react';
import * as React from 'react';

import { cn } from '../../lib/utils';
import { Button } from './button';
import { Popover, PopoverContent, PopoverTrigger } from './popover';

interface Option {
  label: string;
  value: string;
  category?: string;
}

interface MultiSelectProps {
  options: Option[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  className?: string;
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = 'Select options...',
  className,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');

  const handleSelect = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((item) => item !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn('w-full justify-between h-auto min-h-[40px]', className)}
        >
          <div className="flex flex-wrap gap-1 text-left">
            {selected.length > 0 ? (
              selected.map((val) => {
                const option = options.find((o) => o.value === val);
                return (
                  <span
                    key={val}
                    className="bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded text-xs flex items-center gap-1"
                  >
                    {option?.label || val}
                    <span
                      className="cursor-pointer hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelect(val);
                      }}
                    >
                      <X className="h-3 w-3" />
                    </span>
                  </span>
                );
              })
            ) : (
              <span className="text-muted-foreground font-normal">{placeholder}</span>
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0 z-[200]" align="start">
        <div className="flex flex-col max-h-[300px]">
          <div className="flex items-center border-b px-3 py-2 sticky top-0 bg-popover z-10">
            <input
              className="flex h-9 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
          </div>
          <div className="overflow-y-auto flex-1 p-1">
            {filteredOptions.length === 0 ? (
              <p className="p-2 text-sm text-muted-foreground text-center">No results found.</p>
            ) : (
              Array.from(new Set(filteredOptions.map((o) => o.category || 'Other')))
                .sort()
                .map((category) => {
                  const categoryOptions = filteredOptions.filter(
                    (o) => (o.category || 'Other') === category
                  );
                  return (
                    <div key={category}>
                      <div className="sticky top-0 z-10 bg-popover px-2 py-1 text-xs font-semibold text-muted-foreground w-full">
                        {category}
                      </div>
                      {categoryOptions.map((option) => (
                        <div
                          key={option.value}
                          className={cn(
                            'relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground',
                            selected.includes(option.value) && 'bg-accent/50'
                          )}
                          onClick={() => handleSelect(option.value)}
                        >
                          <Check
                            className={cn(
                              'mr-2 h-4 w-4',
                              selected.includes(option.value) ? 'opacity-100' : 'opacity-0'
                            )}
                          />
                          {option.label}
                        </div>
                      ))}
                    </div>
                  );
                })
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
