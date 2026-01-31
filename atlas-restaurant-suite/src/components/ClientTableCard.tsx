import React from 'react';
import { useNavigate } from 'react-router-dom';
import { TableSession } from '@/context/RestaurantContext';
import { cn } from '@/lib/utils';

interface ClientTableCardProps {
  session: TableSession;
  index: number;
}

const ClientTableCard: React.FC<ClientTableCardProps> = ({ session, index }) => {
  const navigate = useNavigate();
  
  // Determine if table is occupied
  const isOccupied = session.requests.length > 0 || session.cart.length > 0 || session.isLocked;
  const status = isOccupied ? 'occupied' : 'free';
  const tableNumber = session.tableId.replace('Table_', '');

  const handleClick = () => {
    if (!session.isLocked && !isOccupied) {
      navigate(`/menu?table=${session.tableId}`);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={cn(
        'group relative bg-card border-2 rounded-xl cursor-pointer transition-all duration-200',
        'hover:shadow-lg hover:-translate-y-1',
        'min-h-[160px] flex flex-col items-center justify-center p-5',
        status === 'occupied' 
          ? 'border-destructive bg-destructive/5' 
          : 'border-success bg-success/5 hover:border-success/80',
        session.isLocked && 'opacity-50 cursor-not-allowed'
      )}
    >
      {/* Status dot indicator */}
      <div className={cn(
        'absolute top-3 right-3 h-3 w-3 rounded-full',
        status === 'occupied' ? 'bg-destructive' : 'bg-success'
      )} />
      
      {/* Table number - Large and prominent */}
      <div className="mb-3">
        <span className={cn(
          'text-4xl font-bold',
          status === 'occupied' ? 'text-destructive' : 'text-success'
        )}>
          {tableNumber}
        </span>
      </div>
      
      {/* Status text */}
      <div className={cn(
        'text-sm font-medium',
        status === 'occupied' ? 'text-destructive' : 'text-success'
      )}>
        {status === 'occupied' ? 'Occupied' : 'Available'}
      </div>
    </div>
  );
};

export default ClientTableCard;
