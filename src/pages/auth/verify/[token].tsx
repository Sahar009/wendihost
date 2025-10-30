import { useRouter } from "next/router";
import { useEffect } from "react";

export const getServerSideProps = async({req, res} : any) => {


    
  return { 
    props: {
      user: null,
    }, 
  }
    
}


interface IProps {
    user: string;
}

export default function VerifyAccount(props: IProps) {

  const router = useRouter()

  useEffect(() => {

  }, [])


  return (
      <div>

      </div>
  )

}
