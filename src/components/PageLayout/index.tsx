import type { ReactNode } from "react";

interface PageLayoutProps {
  children: ReactNode;
  maxWidth?: "max-w-4xl" | "max-w-6xl";
  title?: string;
  subtitle?: string;
}

const PageLayout = ({ children, maxWidth = "max-w-4xl", title, subtitle }: PageLayoutProps) => {
  return (
    <div className="flex-1 bg-ceruleanBlue-50 pt-6 pb-12">
      <div className={`${maxWidth} mx-auto px-4 md:px-8 mt-6 md:mt-12`}>
        <div className="relative mt-4">
          <div className="absolute w-full h-full bg-ceruleanBlue-500 rounded-lg -top-1" />
          <div className="relative bg-white shadow-lg rounded-lg">
            {(title || subtitle) && (
              <div className="text-center p-4 md:p-8 border-b border-gray-200">
                {title && (
                  <h1 className="text-2xl md:text-3xl font-semibold text-gray-900 tracking-tight">{title}</h1>
                )}
                {subtitle && (
                  <p className="max-w-2xl mx-auto text-sm md:text-base text-gray-600 mt-1">{subtitle}</p>
                )}
              </div>
            )}
            <div className="p-4 md:p-8">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PageLayout;
