
# Install vegeta before you can run this script - https://github.com/tsenart/vegeta

# set a higher ulimit for file descriptors as required if you face "socket too many open files"
# ulimit -n 10000

SUBMISSION_TEST=$(vegeta attack -format=http -rate=200/1s -duration=10s -targets=./participants | tee results.bin | vegeta report > report.txt)
RESULT=$(cat report.txt)
HISTOGRAM=$(cat results.bin | vegeta report -type="hist[0,100ms,500ms,1s,2s,3s,4s,5s,10s,15s,20s,30s]")
PLOT=$(cat results.bin | vegeta plot > plot.html)

echo -e "\n======== Summary ========\n"
echo -e "$RESULT"

echo -e "\n======== Latency Histogram ========\n"
echo -e "$HISTOGRAM"

echo -e "\n======== Latency Chart ========\n"
echo -e "Open Plot file ./plot.html on your browser"

echo -e "\n======== END ========\n"