import { Oval } from "react-loader-spinner"

const LoadingContainer = () => {
    return (
        <div className="flex justify-center items-center h-[60dvh] w-full">
            <Oval
                height={120}
                width={120}
                color="#ffffff"
                wrapperStyle={{}}
                wrapperClass=""
            />
        </div>
    )
}

export default LoadingContainer