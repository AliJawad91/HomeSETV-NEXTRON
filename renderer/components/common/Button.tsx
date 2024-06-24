export const Button = ({ children, onClick }) => {
  return (
    <button
      onClick={onClick}
      className='p-2 text-white  flex items-start bg-gray-400'
    >
      {children}
    </button>
  );
};
