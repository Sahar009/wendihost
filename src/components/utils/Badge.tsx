export type badgeType = "success" | "info" | "error" | "primary"

interface IProps {
    type: badgeType, 
    status: string
}

const Badge = (props: IProps) => {

    const type = props.type
    const status = props.status

    switch (type) {
        case "success":
            return (
                <span className="rounded-full px-4 bg-green-500 p-1 text-white"> 
                    {status} 
                </span>
            )
        case "info":
            return (
                <span className="rounded-full px-4 bg-yellow-500 p-1 text-white"> 
                    {status} 
                </span>
            )
        case "error":
            return (
                <span className="rounded-full px-4 bg-red-500 p-1 text-white"> 
                    {status} 
                </span>
            )
        default:
            return (
                <span className="rounded-full px-4 bg-blue-500 p-1 text-white"> 
                    {status} 
                </span>
            )

    }

}

export default Badge