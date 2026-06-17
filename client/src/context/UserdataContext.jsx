import { createContext, useContext, useEffect, useState } from "react";
const UserDataCtx = createContext(null);
export function UserdataProvider({ children }) {
    const[useralldata,setUseralldata]=useState(null);
    return(
        <UserDataCtx.Provider value={{useralldata,setUseralldata}}>
           {children} 
        </UserDataCtx.Provider>
    )

}
export const useUserData = () => useContext(UserDataCtx);