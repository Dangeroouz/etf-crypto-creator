   import { Sun, Moon } from "lucide-react";
   export const Settings = () => {
 
  return (
    <div>
      <div className="container max-w-6xl mx-auto">
        <div className="gap-6 m-1 mb-3">
          <h1 className="text-3xl font-bold mb-2">Settings</h1>
          <p className="text-gray-600">
            Manage your account settings and preferences.
          </p>
        </div>
        <div className="bg-white p-4 sm:p-6 rounded-xl border border-black/10">
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold">Appearance</h2>
              <p className="text-gray-600 text-sm">
                Customize the look and feel of the application.
              </p>
              <div className="flex justify-between items-center mt-4 space-x-4">
                <div className="">
                    <h2 className="text-lg font-semibold">Theme</h2>
                    <p className="text-gray-600 text-sm">Dark mode</p>
                </div>
                <div className="flex items-center">
                <Sun className="mr-2"/>
                  <label className="relative inline-flex items-center cursor-pointer">
                    
                    <input type="checkbox" value="" className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                  </label>
                  <Moon className="ml-2 text-gray-600"/>
                  </div>
              </div>
            </div>
            <div></div>
            <div></div>
          </div>
        </div>
      </div>
    </div>
  );
};
