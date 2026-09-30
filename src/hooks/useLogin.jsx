import { useEffect, useState, useRef } from "react";
import { postLogin } from "@/services/postLogin";
import { useAuth } from "./useAuth";

export const useLogin = () => {
    
    // const [user, setUser] = useState([])
    // Captcha TURNSTILE [DEPRECATED LATER]
    const [cfToken, setCfToken] = useState(null)
    const captchaRef = useRef(null)
    const [captchaKey, setCaptchaKey] = useState(0)

    const { user, token, isLogged, setSession, clearSession } = useAuth();
    const [state, setState] = useState({ loading: false, error: false })

    const onVerify = async (token) => {
        setCfToken(token)
    }

    const onExpire = () => {
        setCfToken(null)
    }

    // useEffect(() => {
    //     const logeedUser = window.localStorage.getItem("loggedUser")
    //     if (logeedUser) {
    //         const user = JSON.parse(logeedUser)
    //         setUser(user)
    //     }
    // }, [])

    const login = (username, password) => {

        // console.log(cfToken)
        setState({ loading: true, error: false })

        postLogin(username, password, cfToken)
            .then(res => {
                // window.localStorage.setItem("loggedUser", JSON.stringify(res))
                setState({ loading: false, error: false })
                setSession(res)
                // setUser(res)
            })
            .catch(err => {
                console.log(err)
                // window.sessionStorage.removeItem("loggedUser")
                clearSession()
                setState({ loading: false, error: true })
            })
    }

    const logout = () => {
        // setUser(null)
        // window.localStorage.removeItem("loggedUser")
        clearSession()
    }

    // return {
    //     isLoginLoading: state.loading,
    //     hasLoginError: state.error,
    //     isLogged: !Array.isArray(user),
    //     login,
    //     logout,
    //     captchaRef,
    //     captchaKey,
    //     onVerify,
    //     onExpire
    // }

    return {
        isLoginLoading: state.loading,
        hasLoginError: state.error,
        isLogged,
        login,
        logout,
        user,
        token,
        captchaRef,
        captchaKey,
        onVerify,
        onExpire
    }

}