const Footer = () => {
  return (
    <footer className="w-full flex flex-col items-center justify-center py-6 text-gray-400 text-sm select-none border-t border-gray-100 bg-white">
      <a className="text-sm sm:text-base font-light" href="https://github.com/k5sha" >
        Created with <span className="text-red-500">♥</span> <span className="font-semibold">by Yurii
        Yevtushenko</span>
      </a>
      <p className="mt-1 text-xs sm:text-sm text-gray-400">
        &copy; {new Date().getFullYear()} All rights reserved.
      </p>
    </footer>
  );
};

export default Footer;