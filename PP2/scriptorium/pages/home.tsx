import Header from "@/components/header";
import { useUser } from "@/context/userContext";

const HomePage = () => {
    const { user } = useUser();

    const login = user != null;
    
    return (
    <div className="h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center py-10">
            <div className="flex flex-col bg-white w-[90%] h-[90%] shadow-lg px-10 rounded-lg">
                {login ? (
                    <h1 className="text-3xl font-mono py-10">Hello { user.firstName }!</h1>
                ) : (
                    <h1 className="text-3xl font-mono py-10">Hello!</h1>
                )}
                
            </div>
        </div>
    </div>
    );
  };

export default HomePage;