import { DASHBOARD_ROUTES } from '@/libs/enums'
import { useRouter } from 'next/router'


interface IProps {
    index: number
}

export default function TemplateTab(props: IProps) {


    const router = useRouter()

    return (
        <div className='flex  m-4'>

            <div className="text-sm font-medium text-center text-gray-500 border-b border-gray-200">
                <ul className="flex flex-wrap -mb-px cursor-pointer">
               
                    <li onClick={() => router.push(DASHBOARD_ROUTES.TEMPLATES)}  className="mr-2">
                        <div className={`
                            inline-block p-4 border-b-2 rounded-t-lg 
                                ${ props.index === 0 ? 'border-b-4 text-gray-800 border-blue-600 active ' : 'hover:text-gray-600 hover:border-gray-300  border-transparent  border-b-2'}`}>
                                Templates
                        </div>
                    </li>

                    <li onClick={() => router.push(DASHBOARD_ROUTES.SNIPPETS)} className="mr-2">
                        <div className={`
                            inline-block p-4 border-b-2 rounded-t-lg 
                                ${ props.index === 1 ? 'border-b-4 text-gray-800 border-blue-600 active ' : 'hover:text-gray-600 hover:border-gray-300  border-transparent  border-b-2'}`}>
                                Snippets
                        </div>
                    </li>

                </ul>
                
            </div>
        
        </div>
    )

}