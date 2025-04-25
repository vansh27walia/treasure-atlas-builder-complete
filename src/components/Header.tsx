
import React from 'react';
import { Anchor, Map, Ship, Skull } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Header: React.FC = () => {
  return (
    <header className="flex items-center justify-between p-4 border-b-2 border-pirate-darkParchment">
      <div className="flex items-center gap-2">
        <Map className="h-8 w-8 text-pirate-red" />
        <h1 className="text-3xl text-pirate-navy">The Pirate's Atlas Builder</h1>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" className="flex items-center gap-2">
          <Skull className="h-5 w-5" />
          Load Map
        </Button>
        <Button className="wooden-btn flex items-center gap-2">
          <Map className="h-5 w-5" />
          Save Map
        </Button>
      </div>
    </header>
  );
};

export default Header;
