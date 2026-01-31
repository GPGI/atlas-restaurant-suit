import React from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import PremiumMenu from './PremiumMenu';
import { ArrowRight, Utensils, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Index: React.FC = () => {
  const [searchParams] = useSearchParams();
  const tableId = searchParams.get('table');
  const isVip = searchParams.get('vip') === 'true';

  // If table parameter exists, show the premium menu
  if (tableId) {
    return <PremiumMenu />;
  }

  // Otherwise, show a landing/navigation page
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md w-full space-y-8 animate-fade-in">
        {/* Logo */}
        <div className="text-center">
          <h1 className="font-display text-4xl font-bold text-gold tracking-wide">
            ATLAS HOUSE
          </h1>
          <p className="text-muted-foreground mt-2">
            Restaurant Management System
          </p>
        </div>

        {/* Navigation Cards */}
        <div className="space-y-4 stagger-children">
          {/* Menu - Merged Customer and Premium */}
          <Link to="/menu?table=Table_01" className="block">
            <div className="card-premium rounded-xl p-6 hover:border-primary transition-all group">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
                    <Utensils className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-semibold">Menu</h3>
                    <p className="text-sm text-muted-foreground">Ordering interface</p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            </div>
          </Link>

          {/* Client Tables */}
          <Link to="/client-tables" className="block">
            <div className="card-premium rounded-xl p-6 hover:border-primary transition-all group">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
                    <Utensils className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-semibold">Client Tables</h3>
                    <p className="text-sm text-muted-foreground">View all tables and select to order</p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            </div>
          </Link>

          {/* Staff Dashboard */}
          <Link to="/admin" className="block">
            <div className="card-premium rounded-xl p-6 hover:border-primary transition-all group">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center">
                    <Settings className="h-6 w-6 text-foreground" />
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-semibold">Staff Dashboard</h3>
                    <p className="text-sm text-muted-foreground">Table monitoring & management</p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            </div>
          </Link>
        </div>

        {/* Demo Tables */}
        <div className="pt-4">
          <p className="text-xs text-muted-foreground text-center mb-4">Quick Access</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {[1, 2, 3, 4, 5].map(num => (
              <Link
                key={num}
                to={`/menu?table=Table_${String(num).padStart(2, '0')}`}
              >
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs border-border hover:border-primary hover:bg-primary/10"
                >
                  Table {String(num).padStart(2, '0')}
                </Button>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
