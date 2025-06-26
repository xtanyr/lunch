import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer
      className="p-6 text-center mt-auto border-t-2"
      style={{
        backgroundColor: '#FDE7F0', // Very soft, light March 7th pink
        borderColor: '#A0D8F0',    // Clear, light blue for top border
      }}
    >
      <div className="container mx-auto">
        <p
          style={{ color: '#4A5568' }} // Dark grey text for readability
          className="font-semibold"
        >
          xtany development
        </p>
      </div>
    </footer>
  );
};

export default Footer;