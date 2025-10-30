import { useEffect, useState } from "react"

type Verification = "email" | "password" | "text" | "slug" | "phone"

const useInput = (verification: Verification, minLength?: number, initial?: any) => {

    const [value, setValue] = useState<string | number>(initial || "")
    const [errorWarning, setErrorWarning] = useState(false)
    const [onFocus, setOnFocus] = useState(false)
    const [error, setError] = useState<boolean>(false)
    const [errorMessage, setErrorMessage] = useState<string>("")

    useEffect(() => {

        switch (verification) {
            case "email":
                const emailValue = String(value || '');
                if (!emailValue.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
                    setError(true)
                    setErrorMessage("Invalid email address")
                } else {
                    setError(false)
                    setErrorMessage("")
                }
                break
            case "password":
                if (!(value as string)?.match(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])(?=.{8,})/)) {
                    setError(true)
                    setErrorMessage("Password must contain atleast 8 characters, one uppercase and lowercase letter, number and special character")
                } else {
                    setError(false)
                    setErrorMessage("")
                }
                break
            case "text":
                if ((value as string)?.length < Number(minLength)) {
                    setError(true)
                    setErrorMessage(`Too short, should contain atleast ${minLength} characters`)
                } else {
                    setError(false)
                    setErrorMessage("")
                }
                break
            case "slug":
                if ((value as string)?.length < Number(minLength) || (value as string)?.includes(" ")) {
                    setError(true)
                    setErrorMessage(`No white space and should contain atleast ${minLength} characters`)
                } else {
                    setError(false)
                    setErrorMessage("")
                }
                break
            case "phone":
                if (!(value as string)?.match(/^\s*(?:\+?(\d{1,3}))?[-. (]*(\d{3})[-. )]*(\d{3})[-. ]*(\d{4})(?: *x(\d+))?\s*$/)) {
                    setError(true)
                    setErrorMessage("Invalid phone number")
                } else {
                    setError(false)
                    setErrorMessage("")
                }
            default:
                console.error("")

        }

    }, [value, verification, minLength])

    function getValue() {  
        return value
    }


    useEffect(() => {
        if (error && onFocus) {
            setErrorWarning(true)
        } else {
            setErrorWarning(false)
        }
    }, [error, onFocus])

    return { setValue, setError, setErrorMessage, setOnFocus, getValue, value, error, errorMessage, errorWarning}
}

export default useInput