for i in {5..14}
do
    YEAR=$i
    if [ "$i" -lt "10" ]
    then
      YEAR="0$YEAR"
    fi    
FILENAME="20"$YEAR"_dc_age_sex_e.pdf"
echo $FILENAME
curl "http://www.voterregistration.gov.hk/eng/$FILENAME" > $FILENAME
done
