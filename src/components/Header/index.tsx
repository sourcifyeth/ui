import { useState, useEffect } from "react";
import { HiMenu, HiX } from "react-icons/hi";
import { Link } from "react-router-dom";
import { Tooltip } from "react-tooltip";
import { SiMatrix } from "react-icons/si";
import { RiTwitterXFill } from "react-icons/ri";
import logoText from "../../assets/logo-rounded.svg";
import { DOCS_URL, PLAYGROUND_URL, REPOSITORY_URL } from "../../constants";

const Header = ({ className }: { className?: string }) => {
  const [showNav, setShowNav] = useState(false);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth > 1024); // tailwind md=768px
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };

    const handleResize = () => {
      setIsDesktop(window.innerWidth > 1024);
    };

    window.addEventListener("scroll", handleScroll);
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const toggleNav = () => {
    setShowNav((prev) => !prev);
  };
  return (
    <div
      className={`flex w-full p-4 sticky top-0 backdrop-filter backdrop-blur-sm bg-gray-100 bg-opacity-70 ${
        isScrolled ? "first:shadow-md" : ""
      } z-10 ${className}`}
    >
      <div className="flex flex-wrap lg:flex-nowrap items-center justify-between max-w-[100rem] w-full mx-auto px-8 md:px-12 lg:px-12 xl:px-24 ">
        <Tooltip id="social-tooltip" />
        <div className="flex items-center">
          <Link to="/" className="flex items-center">
            <img src={logoText} alt="Sourcify logo" className="max-h-10" />
            <span className="ml-3 text-gray-700 font-vt323 text-2xl">sourcify.eth</span>
          </Link>
        </div>
        <button className="block lg:hidden" onClick={toggleNav}>
          <HiMenu className="text-gray-700 text-3xl hover:text-ceruleanBlue-500" />
        </button>
        <div
          className={`${showNav || isDesktop ? "flex" : "hidden"} ${
            !isDesktop ? "absolute top-0 left-0 h-screen w-screen z-20" : ""
          } items-center justify-center lg:justify-end text-center flex-col lg:flex-row py-4 lg:mt-0 bg-gray-100 lg:bg-transparent bg-opacity-95 w-full`}
        >
          {!isDesktop && showNav && (
            <button className="absolute top-4 right-8" onClick={toggleNav}>
              <HiX className="text-gray-700 text-3xl hover:text-ceruleanBlue-500" />
            </button>
          )}

          <nav
            className={`${
              showNav || isDesktop ? "flex flex-wrap justify-end ml-4" : "hidden"
            } font-vt323 text-2xl text-gray-700 flex-col lg:flex-row`}
          >
            <a
              className="link-underline mx-2 my-2 lg:mx-6 hover:text-ceruleanBlue-500"
              href={process.env.REACT_APP_VERIFY_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              Verify
            </a>
            <Link className="link-underline mx-2 my-2 lg:mx-6 hover:text-ceruleanBlue-500" to="/address">
              Lookup
            </Link>
            <a
              className="link-underline mx-2 my-2 lg:mx-6 hover:text-ceruleanBlue-500"
              href={REPOSITORY_URL}
            >
              Contract Repo
            </a>
            <a
              className="link-underline mx-2 my-2 lg:mx-6 hover:text-ceruleanBlue-500"
              href="https://4byte.sourcify.dev"
            >
              4byte
            </a>
            <a className="link-underline mx-2 my-2 lg:mx-6 hover:text-ceruleanBlue-500" href={DOCS_URL}>
              Docs
            </a>
            <a
              className="link-underline mx-2 my-2 lg:mx-6 hover:text-ceruleanBlue-500"
              href="https://docs.sourcify.dev/blog/"
            >
              Blog
            </a>
            <a className="link-underline mx-2 my-2 lg:mx-6 hover:text-ceruleanBlue-500" href={PLAYGROUND_URL}>
              Playground
            </a>
            <div className="flex items-center ml-2 mt-4 lg:mt-0">
              <iframe
                src="https://ghbtns.com/github-btn.html?user=argotorg&repo=sourcify&type=star&count=true&size=large"
                // frameborder="0"
                scrolling="0"
                width="135"
                height="30"
                title="GitHub"
                className=""
              ></iframe>
            </div>
          </nav>
          {/* Icons */}
          <div className="flex items-center ml-2 mt-6 lg:mt-0">
            <a className="px-2 hover-to-fill" href="https://x.com/sourcifyeth" target="_blank" rel="noreferrer">
              <RiTwitterXFill className="h-[1.4rem] w-auto fill-gray-700 500" />
            </a>
            <a
              className="pl-2 hover-to-fill"
              href="https://matrix.to/#/#ethereum_source-verify:gitter.im"
              target="_blank"
              rel="noreferrer"
              data-tooltip-id="matrix-chat-tooltip"
              data-tooltip-content="Matrix chat"
            >
              <SiMatrix className="h-6 w-auto fill-gray-700 hover:fill-ceruleanBlue-500" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;
