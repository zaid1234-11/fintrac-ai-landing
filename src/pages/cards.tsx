import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, MoreVertical, Wifi, Nfc, Trash2, Star, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from 'sonner';

// --- Types and Mock Data ---

interface CardData {
  id: string;
  bank: string;
  lastFour: string;
  type: 'debit' | 'credit';
  cardType: 'visa' | 'mastercard';
  expiry: string;
  theme: 'blue' | 'red' | 'purple' | 'green' | 'black'; // Added more themes
  isDefault?: boolean;
}

const initialMockCards: CardData[] = [
  {
    id: '1',
    bank: 'HDFC Bank',
    lastFour: '1234',
    type: 'debit',
    cardType: 'visa',
    expiry: '12/28',
    theme: 'blue',
    isDefault: true,
  },
  {
    id: '2',
    bank: 'ICICI Bank',
    lastFour: '5678',
    type: 'credit',
    cardType: 'mastercard',
    expiry: '10/27',
    theme: 'red',
  },
  {
    id: '3',
    bank: 'Axis Bank',
    lastFour: '9876',
    type: 'credit',
    cardType: 'visa',
    expiry: '05/29',
    theme: 'purple',
  },
];

const cardThemes = {
  blue: 'from-blue-500/70 to-blue-800/70 border-blue-400/50 shadow-blue-500/30',
  red: 'from-red-500/70 to-red-800/70 border-red-400/50 shadow-red-500/30',
  purple: 'from-purple-500/70 to-purple-800/70 border-purple-400/50 shadow-purple-500/30',
  green: 'from-green-500/70 to-green-800/70 border-green-400/50 shadow-green-500/30',
  black: 'from-gray-700/70 to-gray-900/70 border-gray-500/50 shadow-gray-500/30',
};

const mockTransactions = [
    { id: 't1', merchant: 'Zomato', amount: 450.00, date: 'Oct 28' },
    { id: 't2', merchant: 'Myntra', amount: 2500.00, date: 'Oct 27' },
    { id: 't3', merchant: 'Airtel Bill', amount: 1199.00, date: 'Oct 25' },
];

// --- Add Card Form Component ---

const AddCardForm = ({ onCardAdd, setOpen }: { onCardAdd: (newCard: CardData) => void, setOpen: (open: boolean) => void }) => {
  const [bank, setBank] = useState('');
  const [lastFour, setLastFour] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cardType, setCardType] = useState<'visa' | 'mastercard' | ''>('');
  const [type, setType] = useState<'debit' | 'credit' | ''>('');

  const handleSubmit = () => {
    if (!bank || !lastFour || !expiry || !cardType || !type) {
        toast.error("Please fill out all fields.");
        return;
    }
    if (lastFour.length !== 4 || isNaN(Number(lastFour))) {
        toast.error("Please enter 4 valid digits for the last four numbers.");
        return;
    }
    
    const newCard: CardData = {
      id: (Math.random() * 10000).toString(),
      bank,
      lastFour,
      expiry,
      cardType: cardType as 'visa' | 'mastercard',
      type: type as 'debit' | 'credit',
      theme: ['blue', 'red', 'purple', 'green', 'black'][Math.floor(Math.random() * 5)] as CardData['theme'],
      isDefault: false, // New cards are not default
    };
    
    onCardAdd(newCard);
    toast.success("New card added successfully!");
    setOpen(false); // Close the dialog
  };

  return (
    <div className="grid gap-4 py-4 text-slate-300">
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="bank" className="text-right">Bank Name</Label>
        <Input id="bank" value={bank} onChange={(e) => setBank(e.target.value)} className="col-span-3 bg-slate-700 border-slate-600 text-white" />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="lastFour" className="text-right">Last 4 Digits</Label>
        <Input id="lastFour" value={lastFour} onChange={(e) => setLastFour(e.target.value)} maxLength={4} className="col-span-3 bg-slate-700 border-slate-600 text-white" />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="expiry" className="text-right">Expiry (MM/YY)</Label>
        <Input id="expiry" value={expiry} onChange={(e) => setExpiry(e.target.value)} placeholder="12/28" className="col-span-3 bg-slate-700 border-slate-600 text-white" />
      </div>
       <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="cardType" className="text-right">Card Network</Label>
        <Select onValueChange={(value: 'visa' | 'mastercard') => setCardType(value)}>
            <SelectTrigger className="col-span-3 bg-slate-700 border-slate-600 text-white">
                <SelectValue placeholder="Select network" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="visa">Visa</SelectItem>
                <SelectItem value="mastercard">Mastercard</SelectItem>
            </SelectContent>
        </Select>
      </div>
       <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="type" className="text-right">Card Type</Label>
        <Select onValueChange={(value: 'debit' | 'credit') => setType(value)}>
            <SelectTrigger className="col-span-3 bg-slate-700 border-slate-600 text-white">
                <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="debit">Debit</SelectItem>
                <SelectItem value="credit">Credit</SelectItem>
            </SelectContent>
        </Select>
      </div>
      <DialogFooter>
        <Button onClick={handleSubmit} className="bg-primary text-white hover:bg-primary/90">Save Card</Button>
      </DialogFooter>
    </div>
  );
};

// --- Main Cards Page Component ---

const CardsPage = () => {
  const [mockCards, setMockCards] = useState<CardData[]>(initialMockCards);
  const [selectedCard, setSelectedCard] = useState<CardData | null>(initialMockCards[0] || null);
  const [isAddCardOpen, setIsAddCardOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [cardToDelete, setCardToDelete] = useState<CardData | null>(null);

  const handleAddCard = (newCard: CardData) => {
    // If this is the first card, make it default
    if (mockCards.length === 0) {
      newCard.isDefault = true;
    }
    setMockCards(prevCards => [newCard, ...prevCards]);
    setSelectedCard(newCard); // Select the new card immediately
  };

  const handleSetDefault = (cardId: string) => {
    setMockCards(prevCards =>
      prevCards.map(card => ({
        ...card,
        isDefault: card.id === cardId,
      }))
    );
    toast.success("Default card updated!");
  };

  const openDeleteAlert = (card: CardData) => {
    setCardToDelete(card);
    setIsDeleteAlertOpen(true);
  };

  const handleDeleteCard = () => {
    if (!cardToDelete) return;

    setMockCards(prevCards => {
      const remainingCards = prevCards.filter(card => card.id !== cardToDelete.id);
      
      // If the deleted card was default, make the first remaining card the new default
      if (cardToDelete.isDefault && remainingCards.length > 0) {
        remainingCards[0].isDefault = true;
      }
      
      // If the deleted card was the selected card, select the new default or first card
      if (selectedCard?.id === cardToDelete.id) {
          setSelectedCard(remainingCards.find(c => c.isDefault) || remainingCards[0] || null);
      }
      
      return remainingCards;
    });

    toast.success("Card deleted successfully.");
    setIsDeleteAlertOpen(false);
    setCardToDelete(null);
  };


  return (
    <div className="p-4 sm:p-8 rounded-lg min-h-screen text-white overflow-hidden relative">
      {/* Animated background blobs */}
      <div className="absolute top-0 left-0 w-72 h-72 bg-purple-500/30 rounded-full filter blur-3xl opacity-50 animate-blob"></div>
      <div className="absolute top-0 right-0 w-72 h-72 bg-blue-500/30 rounded-full filter blur-3xl opacity-50 animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-0 left-1/4 w-72 h-72 bg-red-500/30 rounded-full filter blur-3xl opacity-50 animate-blob animation-delay-4000"></div>

      <div className="relative z-10 space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">My Cards</h1>
            <p className="text-slate-400">Manage your linked credit & debit cards.</p>
          </div>
          
          <Dialog open={isAddCardOpen} onOpenChange={setIsAddCardOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary/80 text-white backdrop-blur-md border border-primary/50 shadow-lg shadow-primary/30 hover:bg-primary">
                <Plus className="mr-2 h-4 w-4" /> Add New Card
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-slate-800/80 backdrop-blur-lg border-white/10 text-white">
              <DialogHeader>
                <DialogTitle className="text-white">Add a New Card</DialogTitle>
                <DialogDescription className="text-slate-400">
                  Enter your card details below.
                </DialogDescription>
              </DialogHeader>
              <AddCardForm onCardAdd={handleAddCard} setOpen={setIsAddCardOpen} />
            </DialogContent>
          </Dialog>

        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Card Selection */}
          <div className="lg:col-span-1 space-y-4 max-h-[70vh] overflow-y-auto pr-2">
            {mockCards.length === 0 && (
              <Card className="bg-black/20 backdrop-blur-2xl border-white/10 text-center p-8">
                <p className="text-slate-400">No cards found. Add a new card to get started.</p>
              </Card>
            )}
            {mockCards.map((card) => (
              <Card
                key={card.id}
                onClick={() => setSelectedCard(card)}
                className={cn(
                  'bg-black/20 backdrop-blur-2xl border transition-all duration-300 cursor-pointer shadow-lg',
                  'hover:scale-105 hover:shadow-2xl',
                  selectedCard?.id === card.id
                    ? 'border-primary/80 shadow-primary/40'
                    : 'border-white/10'
                )}
              >
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <img 
                      src={card.cardType === 'visa' ? 'https://placehold.co/40x25/ffffff/000000?text=VISA' : 'https://placehold.co/40x25/ffffff/000000?text=MC'} 
                      alt={card.cardType}
                      className="rounded"
                    />
                    <div>
                      <p className="font-semibold">{card.bank} {card.isDefault && <span className="text-xs text-primary">(Default)</span>}</p>
                      <p className="text-sm text-slate-400">**** **** **** {card.lastFour}</p>
                    </div>
                  </div>
                  
                  <AlertDialog open={isDeleteAlertOpen && cardToDelete?.id === card.id} onOpenChange={(open) => {
                      if (!open) {
                        setCardToDelete(null);
                      }
                      setIsDeleteAlertOpen(open);
                    }}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:bg-slate-700/50">
                          <MoreVertical className="w-5 h-5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700 text-white">
                        {!card.isDefault && (
                          <DropdownMenuItem onClick={() => handleSetDefault(card.id)} className="cursor-pointer focus:bg-slate-700">
                            <Star className="mr-2 h-4 w-4" /> Set as Default
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem className="cursor-pointer focus:bg-slate-700">
                          <ShieldAlert className="mr-2 h-4 w-4" /> Report Stolen
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-slate-700" />
                        {/* FIX: Removed AlertDialogTrigger wrapper from DropdownMenuItem.
                          The onClick handler now directly sets the state to open the controlled AlertDialog.
                        */}
                        <DropdownMenuItem onClick={() => openDeleteAlert(card)} className="text-red-400 cursor-pointer focus:bg-red-900/50 focus:text-red-300">
                          <Trash2 className="mr-2 h-4 w-4" /> Delete Card
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <AlertDialogContent className="bg-slate-800/80 backdrop-blur-lg border-white/10 text-white">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription className="text-slate-400">
                          This action cannot be undone. This will permanently delete your
                          card from our servers.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="bg-slate-700 border-slate-600 hover:bg-slate-600">Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteCard} className="bg-red-600 hover:bg-red-700">
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>

                </CardContent>
              </Card>
            ))}
          </div>

          {/* Selected Card Details */}
          <div className="lg:col-span-2 space-y-8">
            {selectedCard ? (
              <>
                {/* Card Visualization */}
                <div className={cn(
                  'rounded-xl p-6 shadow-2xl backdrop-blur-xl border relative overflow-hidden',
                  'transition-all duration-500',
                  cardThemes[selectedCard.theme as keyof typeof cardThemes]
                )}>
                  <div className="absolute inset-0 bg-gradient-to-br opacity-50"></div>
                  <div className="relative z-10">
                    <div className="flex justify-between items-center mb-8">
                      <span className="text-xl font-bold">{selectedCard.bank}</span>
                      <img 
                        src={selectedCard.cardType === 'visa' ? 'https://placehold.co/60x30/ffffff/000000?text=VISA' : 'https://placehold.co/60x30/ffffff/000000?text=MC'} 
                        alt={selectedCard.cardType}
                        className="rounded" 
                      />
                    </div>
                    <div className="flex items-center justify-between mb-4">
                        <Wifi className="w-6 h-6 rotate-90"/>
                        <Nfc className="w-6 h-6"/>
                    </div>
                    <div className="font-mono text-2xl tracking-widest mb-6">
                      **** **** **** {selectedCard.lastFour}
                    </div>
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-xs uppercase">Expires End</p>
                        <p className="font-medium">{selectedCard.expiry}</p>
                      </div>
                      <p className="text-lg font-medium capitalize">{selectedCard.type} Card {selectedCard.isDefault && <span className="text-xs">(Default)</span>}</p>
                    </div>
                  </div>
                </div>

                {/* Recent Transactions */}
                <Card className="bg-slate-800/40 backdrop-blur-2xl border-white/10 shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-white">Recent Transactions</CardTitle>
                    <CardDescription className="text-slate-400">Activity from this card ({selectedCard.bank})</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {mockTransactions.map(tx => (
                        <div key={tx.id} className="flex justify-between items-center p-3 bg-slate-900/50 rounded-lg">
                            <div>
                                <p className="font-semibold text-white">{tx.merchant}</p>
                                <p className="text-sm text-slate-400">{tx.date}</p>
                            </div>
                            <p className="font-bold text-lg text-red-400">-₹{tx.amount.toLocaleString('en-IN')}</p>
                        </div>
                    ))}
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card className="bg-slate-800/40 backdrop-blur-2xl border-white/10 shadow-lg flex items-center justify-center h-96">
                  <p className="text-slate-400">Select a card to see its details or add a new one.</p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CardsPage;
