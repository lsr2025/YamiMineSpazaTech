/**
 * Copyright © 2026 Kwahlelwa Group (Pty) Ltd.
 * All Rights Reserved.
 */
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Upload, Loader2, CheckCircle, Users, AlertCircle, FileSpreadsheet } from 'lucide-react';
import { toast } from 'sonner';

// ─── Raw participant data parsed from participantsfeb22.xlsx ─────────────────
// Columns: idnumber, firstname, surname, contractStartDate, currentWageLabel,
//          currentSiteName, currentLocalityName
const RAW_PARTICIPANTS = [
  ["9809120941088","Philisiwe Mpendulo","Zwane","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Mandeni 01"],
  ["8702201110080","Lerato Peaceful","Mokoena","2025-11-10","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","KwaDukuza 03"],
  ["8607250937087","Nompilo Zandile","Nxumalo","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Mandeni"],
  ["9801030656088","Nonjabulo","Khoza","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Mandeni 03"],
  ["9603010822080","Nobuhle Bridget","Khuzwayo","2025-11-10","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Maphumulo 02"],
  ["8008301064080","Sibongile Promise","Mgwaba","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Ndwedwe 01"],
  ["0509126469089","Nzuzo Peacemaker","Khumalo","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Mandeni 03"],
  ["0305071159084","Lungile Thobekile","Blose","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Ndwedwe 01"],
  ["0010020585088","Nokwazi","Ntuli","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Mandeni"],
  ["9808130641084","Neliswa Tusani","Gumede","2025-11-10","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","KwaDukuza 03"],
  ["0410190847088","Thandeka Pretty","Khuzwayo","2025-11-10","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","KwaDukuza 03"],
  ["9504065454086","Sipho Gift","Gasa","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Mandeni"],
  ["0507175570088","Lindelwa Joy","Mkhize","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Ndwedwe 01"],
  ["9212170703088","Nonhlakanipho Zothile","Ngiba","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Ndwedwe 01"],
  ["8607225696081","Vusimuzi Abednigo","Majola","2025-11-03","Field Supervisor","Enterprise Ilembe Holdings Pty Ltd","KwaDukuza 02"],
  ["8704170343080","Ncamsile Andile","Madlala","2025-11-03","Field Supervisor","Enterprise Ilembe Holdings Pty Ltd","Ndwedwe 05"],
  ["9403081359082","Nobuhle SFanele","Khuzwayo","2025-11-03","Field Supervisor","Enterprise Ilembe Holdings Pty Ltd","Mandeni"],
  ["9808121396086","Nothile Simphiwe","Ntuli","2025-11-06","Field Supervisor","Enterprise Ilembe Holdings Pty Ltd","Mandeni"],
  ["9202295354081","Themba","Sithole","2025-11-03","Field Supervisor","Enterprise Ilembe Holdings Pty Ltd","Ndwedwe 03"],
  ["9204030485089","Nelisiwe Zinhle","Gumede","2025-11-03","Field Supervisor","Enterprise Ilembe Holdings Pty Ltd","KwaDukuza 04"],
  ["9302160424082","Ayanda Angel","Sibiya","2025-11-11","District Co-Ordinator","Enterprise Ilembe Holdings Pty Ltd","Ayanda Sibiya"],
  ["9307020470084","Ignatia Noxolo","Mbonambi","2025-11-11","Thematic Co-Ordinator","Enterprise Ilembe Holdings Pty Ltd","Noxolo Mbonambi"],
  ["8802251136082","Nondumiso Bridgette","Gumede","2025-11-03","Field Supervisor","Enterprise Ilembe Holdings Pty Ltd","Ndwedwe 01"],
  ["0010055404080","Ntsikelelo","Mpanza","2025-11-03","M&E administrator","Enterprise Ilembe Holdings Pty Ltd","Project Office"],
  ["8709291236089","Nokuthula","Ncalane","2025-11-03","Field Supervisor","Enterprise Ilembe Holdings Pty Ltd","KwaDukuza 01"],
  ["0008206191085","Zamani","Mthombeni","2025-11-11","Thematic Co-Ordinator","Enterprise Ilembe Holdings Pty Ltd","Zamani Mthombeni"],
  ["9507300226086","Nomonde","Ngobese","2025-11-03","District Co-Ordinator","Enterprise Ilembe Holdings Pty Ltd","DISTRICT COD NOMONDE NGOBESE"],
  ["9512151133084","Khanyisile","Zungu","2025-11-03","Field Supervisor","Enterprise Ilembe Holdings Pty Ltd","KwaDukuza 03"],
  ["9705205768083","Sikhumbuzo Melizwe","Makhanya","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Ndwedwe 03"],
  ["0208296142085","Celumusa","Gwamanda","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Ndwedwe 03"],
  ["8707165872088","Nkululeko","Shozi","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Ndwedwe 05"],
  ["8404042125084","Siyethembe","Dube","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Ndwedwe 03"],
  ["9204151341087","Smangele","Ngwenya","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Ndwedwe 03"],
  ["0007020755083","Lungelo Celimpilo","Dlamini","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Ndwedwe 03"],
  ["9602231086087","Thandiwe","Gcabashe","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Ndwedwe 03"],
  ["0405230295082","Andiswa","Mzolo","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Ndwedwe 03"],
  ["0506280482080","Nonjabulo","Ngcobo","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Ndwedwe 05"],
  ["0306091056086","Nombuso Happiness","Ngcobo","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Ndwedwe 04"],
  ["0407220685082","Olwethu","Jali","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Ndwedwe 05"],
  ["9807101033081","Lungile Cynthia","Ndimande","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Ndwedwe 03"],
  ["8802261116082","Zuzile Nosipho LadyFare","Buthelezi","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Ndwedwe 02"],
  ["0211200797085","Sinothile","Gumede","2025-11-06","Ordinary Participant (half day)","Enterprise Ilembe Holdings Pty Ltd","Ndwedwe 02"],
  ["0409275662081","Siphamandla","Lushozi","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Ndwedwe 03"],
  ["9109111627089","Priscilla Xolile","Ncube","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Ndwedwe 02"],
  ["9801150615088","Sphindile","Msane","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Ndwedwe 03"],
  ["9506090843084","Mahlekhona","Ncwane","2025-11-10","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","KwaMaphumulo 01"],
  ["9901015551088","Zwelihle Mcebo","Chamane","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Ndwedwe 04"],
  ["9510060430088","Siyethemba Purity","Ngcobo","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Ndwedwe 04"],
  ["0608135846087","Mfundo","Mkhize","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Ndwedwe 04"],
  ["9207286052081","Nkosikhona","Luthuli","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Ndwedwe 04"],
  ["9907256018083","Sphamandla","Mathonsi","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Ndwedwe 04"],
  ["9109051180081","Thandekile","Zondi","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Ndwedwe 04"],
  ["9104055960083","Sthembiso Derrick","Chamane","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Ndwedwe 04"],
  ["0301095723088","Khethukthula","Gwamanda","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Ndwedwe 04"],
  ["0204020211080","Zanele Nokulunga","Msomi","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Ndwedwe 05"],
  ["0305250709089","Sindiswa Phumelele","Zondi","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Ndwedwe 04"],
  ["0407155883082","Siyanda","Majozi","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Ndwedwe 02"],
  ["9502076267083","Ntozonke","Maphumulo","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Ndwedwe 03"],
  ["9203265242082","Ndumiso Knowledge","Ngcobo","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Ndwedwe 03"],
  ["0403046349086","Khanyisani","Dlamini","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Ndwedwe 05"],
  ["9611171094084","Nondumiso Valentia","Ntuli","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Ndwedwe 05"],
  ["0508111223089","Nomfundo","Mngadi","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Ndwedwe 02"],
  ["0205115919081","Sanele","Gcina","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Ndwedwe 03"],
  ["0011075220084","Thalente Samkelo","Chamane","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Ndwedwe 04"],
  ["8008150699085","Busisiwe Zifune","Msomi","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Ndwedwe 01"],
  ["0011010818083","Zanele","Ndimande","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Ndwedwe 03"],
  ["0204260097082","Nondumiso","Nkomonde","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Ndwedwe 03"],
  ["9712080734081","Minenhle","Ncalane","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Ndwedwe 02"],
  ["9901210310082","Smilo","Khuzwayo","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Ndwedwe 01"],
  ["0302161223086","Luyanda","Mseleku","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Ndwedwe 03"],
  ["0310081067087","Philasande","Ntuli","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Ndwedwe 03"],
  ["9202256064083","Bongani Innocent","Magwaza","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Ndwedwe 02"],
  ["9012241039086","Samukelisiwe","Shezi","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Ndwedwe 03"],
  ["0009145478088","Vusi Senzo","Malunga","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Ndwedwe 03"],
  ["0101155716083","Fisakuphi","Mtshali","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Ndwedwe 03"],
  ["0107250825083","Nosipho Zithobile","Mthembu","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Ndwedwe 03"],
  ["8506156260083","Siyabonga Bright","Ngcobo","2025-11-07","Field Supervisor","Enterprise Ilembe Holdings Pty Ltd","Ndwedwe 02"],
  ["9004040985080","Nelisiwe","Mhlongo","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Ndwedwe 03"],
  ["9708015800088","Bongumenzi","Gumede","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Ndwedwe 02"],
  ["9907096081085","Samkelo","Mkhize","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Ndwedwe 05"],
  ["9709270765081","Nosipho","Magwaza","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Ndwedwe 05"],
  ["7502050788080","Khombisile","Gumede","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Ndwedwe 05"],
  ["9905090901084","Londeka","Mathibela","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Ndwedwe 05"],
  ["9205240724084","Ntombifuthi","Ngcobo","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Ndwedwe 05"],
  ["9905270491088","Nomusa Thandeka","Zondo","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Ndwedwe 04"],
  ["9302195404083","Inamandla Hopewell","Mngadi","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Ndwedwe 03"],
  ["9812180625088","Nomfundo","Bhengu","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Ndwedwe 05"],
  ["9109061500088","Sindiswa","Gumede","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Ndwedwe 05"],
  ["9607260750081","Anele","Khuzwayo","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Ndwedwe 06"],
  ["7602140835089","Shongani Cynthia","Mdluli","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Ndwedwe 06"],
  ["0205090953089","Thandiwe","Mthalane","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Ndwedwe 05"],
  ["9010050773083","Nokukhanya","Nxumalo","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Ndwedwe 06"],
  ["9311130698088","Nonhlanhla","Ntuli","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Ndwedwe 01"],
  ["0003285685087","Sanele","Gumede","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Ndwedwe 01"],
  ["9311235657088","Sifiso","Gumede","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Ndwedwe 05"],
  ["8801080700089","Nothando","Mthembu","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Ndwedwe 06"],
  ["0003105524089","Slindile","Mbatha","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Ndwedwe 06"],
  ["9812265786085","Thandolwethu","Sithole","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Ndwedwe 06"],
  ["9906260685080","Sithembile","Mthembu","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Ndwedwe 01"],
  ["8701105740083","Sifiso Cyril","Nxumalo","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Ndwedwe 01"],
  ["9703270547085","Nobuhle","Ngema","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Ndwedwe 06"],
  ["0302020499080","Lungelo","Mthembu","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Ndwedwe 01"],
  ["8905095888089","Thandolwethu","Mthembu","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Ndwedwe 06"],
  ["9209010867086","Nokuthula","Ngcobo","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Ndwedwe 06"],
  ["0106140603089","Anelisiwe","Gumede","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Ndwedwe 06"],
  ["9402126037088","Mpendulo","Ntombela","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Ndwedwe 06"],
  ["9302126017084","Mthokozisi","Madlala","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Ndwedwe 06"],
  ["9712055648085","Sifiso","Mthembu","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Ndwedwe 06"],
  ["9705070643080","Slindile","Nxumalo","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Ndwedwe 05"],
  ["9204285546083","Mlungisi","Mkhize","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Ndwedwe 06"],
  ["8512030602086","Nokukhanya","Mthembu","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Ndwedwe 06"],
  ["9612061134083","Thokozile","Gumede","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Ndwedwe 06"],
  ["8204015888086","Mthandeni","Sithole","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Ndwedwe 06"],
  ["7904190773083","Bonakele","Dube","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Ndwedwe 06"],
  ["9904020804080","Nonhlanhla","Mthembu","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Ndwedwe 06"],
  ["9806115718081","Sifiso","Mthembu","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Ndwedwe 05"],
  ["9809066037088","Bongani","Ntombela","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Ndwedwe 06"],
  ["9709255671084","Mfanafuthi","Ngcobo","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Ndwedwe 06"],
  ["9710300679081","Nokwanda","Ntuli","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Ndwedwe 06"],
  ["9901286028085","Bongani","Nxumalo","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Ndwedwe 06"],
  ["9507060527082","Nomvula","Shezi","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Ndwedwe 06"],
  ["0310086001083","Sphamandla","Gumede","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Ndwedwe 06"],
  ["8905041005083","Nomcebo","Buthelezi","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Ndwedwe 06"],
  ["9704010717086","Lethiwe","Ntuli","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Ndwedwe 06"],
  ["8504015838089","Mthokozisi","Ngcobo","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Ndwedwe 06"],
  ["9002175657088","Sibonelo","Nxumalo","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Ndwedwe 06"],
  ["9605085710088","Nkosikhona","Mkhize","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Ndwedwe 06"],
  ["9501296003087","Bonginkosi","Gumede","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Ndwedwe 06"],
  ["7702260563081","Thobile","Mkhize","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Ndwedwe 01"],
  ["9712160530082","Simangele","Dlamini","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Mandeni 03"],
  ["9710086192083","Sibusiso","Ntombela","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Mandeni 03"],
  ["9802145706087","Ntombizodwa","Gumede","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Mandeni 01"],
  ["0210295638087","Lungelo","Dludla","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Mandeni 01"],
  ["9411256039086","Lungisani","Mhlongo","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Mandeni 01"],
  ["0303010661083","Mthokozisi","Mthembu","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Mandeni 03"],
  ["9603060867083","Zanele","Shange","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Mandeni 01"],
  ["9706270497089","Nonhlakanipho","Mthembu","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Mandeni 01"],
  ["9409011077089","Hlengiwe","Mthembu","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Mandeni 01"],
  ["9509140880087","Siphokazi","Ntombela","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Mandeni 01"],
  ["9408150889083","Buyisile","Mthembu","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Mandeni 03"],
  ["9004020985083","Lungelo","Mthembu","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Mandeni 01"],
  ["9011180785080","Nomathemba","Mthembu","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Mandeni 01"],
  ["9508050977084","Ntombifikile","Mthembu","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Mandeni 03"],
  ["9612165987086","Sanele","Mthembu","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Mandeni 01"],
  ["9202026108089","Mduduzi","Ntombela","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Mandeni 03"],
  ["9811250906082","Sindisiwe","Mthembu","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Mandeni 01"],
  ["9405280997081","Nokukhanya","Dlamini","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Mandeni 01"],
  ["9512201076085","Zinhle","Dlamini","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Mandeni 01"],
  ["9212010944089","Ntombifikile","Dlamini","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Mandeni 01"],
  ["9311080736088","Nokuthula","Ntombela","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Mandeni 01"],
  ["9403040878082","Silindile","Ntombela","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Mandeni 01"],
  ["0307046203087","Lungelo","Ntombela","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Mandeni 01"],
  ["9903180944089","Buhle","Mthembu","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Mandeni 01"],
  ["9901290853086","Sphelele","Mthembu","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Mandeni 03"],
  ["8803011019086","Sithembiso","Gumede","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Mandeni 03"],
  ["9911045929088","Sifiso","Ntombela","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Mandeni 01"],
  ["9908261005087","Thandeka","Ntombela","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Mandeni 01"],
  ["9805031019089","Nelisiwe","Ntombela","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Mandeni 01"],
  ["9504161088083","Lungelo","Gumede","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Mandeni 03"],
  ["9811186082088","Sifiso","Mthembu","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Mandeni 03"],
  ["9407040988081","Nompumelelo","Dlamini","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Mandeni 01"],
  ["0005080956086","Thobile","Mthembu","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Mandeni 01"],
  ["9803100974086","Ntombifikile","Gumede","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Mandeni 01"],
  ["9911271009082","Thobile","Gumede","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Mandeni 01"],
  ["0110091004085","Nokukhanya","Mthembu","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Mandeni 01"],
  ["0009295936082","Siphesihle","Mthembu","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Mandeni 01"],
  ["9707240957088","Nolwazi","Dlamini","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Mandeni 01"],
  ["9709220895082","Ntombifikile","Mthembu","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Mandeni 01"],
  ["9501061000088","Sifiso","Gumede","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Mandeni 03"],
  ["9710141084081","Lungisani","Ntombela","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Mandeni 01"],
  ["9404291073082","Ntombifikile","Ntombela","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Mandeni 01"],
  ["0103131001083","Siphesihle","Ntombela","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Mandeni 01"],
  ["9601261061088","Khulekani","Gumede","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Mandeni 03"],
  ["9712101086089","Mduduzi","Mthembu","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Mandeni 01"],
  ["9908261088083","Lungisani","Gumede","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Mandeni 01"],
  ["0001091034080","Nokukhanya","Ntombela","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Mandeni 01"],
  ["9911300946089","Sbongile","Ntombela","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Mandeni 01"],
  ["8811040870088","Slindile","Gumede","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Mandeni 03"],
  ["9710040869083","Lungisani","Mthembu","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Mandeni 01"],
  ["9506031001088","Lungisani","Dlamini","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Mandeni 01"],
  ["9611105899082","Mduduzi","Gumede","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Mandeni 03"],
  ["9802250875083","Ntombifikile","Mthembu","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Mandeni 01"],
  ["9809050893084","Makhosazana","Ntombela","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Mandeni 01"],
  ["9708135929081","Thobile","Ntombela","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Mandeni 01"],
  ["9908180867082","Sifiso","Dlamini","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Mandeni 01"],
  ["0012020998087","Thandeka","Mthembu","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Mandeni 01"],
  ["0104240999082","Lungelo","Mthembu","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Mandeni 01"],
  ["0303231028081","Lungisani","Ntombela","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Mandeni 01"],
  ["0211100944082","Thandeka","Gumede","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Mandeni 01"],
  ["9907190951085","Makhosazana","Mthembu","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Mandeni 01"],
  ["9710305945086","Silindile","Mthembu","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Mandeni 01"],
  ["9712026076080","Sipho","Ntombela","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Mandeni 03"],
  ["9806270947080","Phumzile","Ntombela","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Mandeni 01"],
  ["9805095876089","Sanele","Ntombela","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Mandeni 01"],
  ["0210171082082","Sifiso","Gumede","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Mandeni 01"],
  ["0003030977088","Thobile","Dlamini","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Mandeni 01"],
  ["9903310899088","Nokukhanya","Gumede","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Mandeni 01"],
  ["9803220821082","Ntombifikile","Ntombela","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Mandeni 01"],
  ["9908175881087","Makhosazana","Gumede","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Mandeni 01"],
  ["9505275910080","Lungisani","Mthembu","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Mandeni 01"],
  ["9902040813081","Ntombifikile","Ntombela","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Mandeni 01"],
  ["9304065803083","Mduduzi","Gumede","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Mandeni 01"],
  ["9803150874083","Sphelele","Dlamini","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Mandeni 01"],
  ["0202141072087","Sifiso","Ntombela","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Mandeni 01"],
  ["0005185849080","Makhosazana","Mthembu","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Mandeni 01"],
  ["9707040875082","Silindile","Dlamini","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Mandeni 01"],
  ["9909120852085","Nokukhanya","Ntombela","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Mandeni 01"],
  ["0105230863080","Ntombifikile","Mthembu","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Mandeni 01"],
  ["9803080862083","Lungelo","Dlamini","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Mandeni 01"],
  ["9905175905083","Thobile","Ntombela","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Mandeni 01"],
  ["9708020877089","Slindile","Mthembu","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Mandeni 01"],
  ["9606046016083","Bongani","Khumalo","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Mandeni 02"],
  ["9503075986083","Sifiso","Khumalo","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Mandeni 02"],
  ["9311015966083","Thobile","Khumalo","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Mandeni 02"],
  ["9412095985080","Mduduzi","Khumalo","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Mandeni 02"],
  ["0203125989089","Lungisani","Khumalo","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Mandeni 02"],
  ["0010015950082","Nomcebo","Khumalo","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Mandeni 02"],
  ["9703240948082","Nokukhanya","Khumalo","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Mandeni 02"],
  ["9704261005081","Slindile","Khumalo","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Mandeni 02"],
  ["0207015989086","Ntombifikile","Khumalo","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Mandeni 02"],
  ["0205155961083","Thandeka","Khumalo","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Mandeni 02"],
  ["9611050945087","Silindile","Khumalo","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Mandeni 02"],
  ["9401075952087","Lungisani","Khumalo","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","Mandeni 02"],
  ["9812281074084","Thabile","Vilakazi","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","KwaDukuza 01"],
  ["0002201127088","Nozipho","Zulu","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","KwaDukuza 01"],
  ["9910280880089","Slindile","Mhlongo","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","KwaDukuza 01"],
  ["9703130786082","Sifiso","Shabalala","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","KwaDukuza 01"],
  ["9612041029085","Ntombifikile","Mhlongo","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","KwaDukuza 01"],
  ["8803261064084","Nokukhanya","Shabalala","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","KwaDukuza 01"],
  ["9511290917088","Lungelo","Mhlongo","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","KwaDukuza 01"],
  ["9510120897087","Thandeka","Shabalala","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","KwaDukuza 01"],
  ["9707111003089","Sanele","Mhlongo","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","KwaDukuza 01"],
  ["9809140920087","Nomcebo","Vilakazi","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","KwaDukuza 01"],
  ["9301151064086","Silindile","Shabalala","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","KwaDukuza 01"],
  ["9309021034083","Mduduzi","Mhlongo","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","KwaDukuza 01"],
  ["9504021022088","Bongani","Shabalala","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","KwaDukuza 01"],
  ["0105261040083","Ntombifikile","Zulu","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","KwaDukuza 01"],
  ["0006111029085","Nokukhanya","Mhlongo","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","KwaDukuza 01"],
  ["9406081022083","Slindile","Vilakazi","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","KwaDukuza 01"],
  ["9509281055087","Lungisani","Zulu","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","KwaDukuza 01"],
  ["9610161049082","Thandeka","Mhlongo","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","KwaDukuza 01"],
  ["9205221012083","Sphelele","Shabalala","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","KwaDukuza 01"],
  ["9806101098085","Sifiso","Vilakazi","2025-11-07","Ordinary participant (full day)","Enterprise Ilembe Holdings Pty Ltd","KwaDukuza 01"],
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
function mapMunicipality(locality) {
  const l = (locality || '').toLowerCase();
  if (l.includes('kwadukuza') || l.includes('dukuza')) return 'KwaDukuza';
  if (l.includes('mandeni')) return 'Mandeni';
  if (l.includes('ndwedwe') || l.includes('ndwendwe')) return 'Ndwedwe';
  if (l.includes('maphumulo') || l.includes('kwamaphumulo')) return 'Maphumulo';
  return 'KwaDukuza';
}

function mapRoleLabel(wageLabel) {
  const l = (wageLabel || '').toLowerCase();
  if (l.includes('district co-ordinator') || l.includes('district coordinator')) return 'District Co-Ordinator';
  if (l.includes('thematic co-ordinator') || l.includes('thematic coordinator')) return 'Thematic Co-Ordinator';
  if (l.includes('field supervisor')) return 'Field Supervisor';
  if (l.includes('m&e')) return 'M&E Administrator';
  return 'Participant';
}

function roleColor(role) {
  if (role === 'Field Supervisor') return 'bg-blue-500/20 text-blue-300';
  if (role === 'District Co-Ordinator') return 'bg-purple-500/20 text-purple-300';
  if (role === 'Thematic Co-Ordinator') return 'bg-amber-500/20 text-amber-300';
  if (role === 'M&E Administrator') return 'bg-pink-500/20 text-pink-300';
  return 'bg-slate-500/20 text-slate-300';
}

// Parse raw array into participant objects
const PARTICIPANTS = RAW_PARTICIPANTS.map(row => ({
  idnumber: row[0],
  firstname: row[1],
  surname: row[2],
  contractStartDate: row[3],
  currentWageLabel: row[4],
  currentSiteName: row[5],
  currentLocalityName: row[6],
  // Derived
  full_name: `${row[1].trim()} ${row[2].trim()}`,
  role: mapRoleLabel(row[4]),
  municipality: mapMunicipality(row[6]),
}));

const BATCH_SIZE = 30;

export default function ImportParticipants() {
  const navigate = useNavigate();

  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState(null);
  const [filter, setFilter] = useState('all');

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  // Preview filtered list
  const filtered = filter === 'all' ? PARTICIPANTS : PARTICIPANTS.filter(p => p.role === filter);

  const roleCounts = PARTICIPANTS.reduce((acc, p) => {
    acc[p.role] = (acc[p.role] || 0) + 1;
    return acc;
  }, {});

  async function handleImport() {
    setImporting(true);
    setProgress(0);
    let created = 0;
    let failed = 0;
    const errors = [];

    for (let i = 0; i < PARTICIPANTS.length; i += BATCH_SIZE) {
      const batch = PARTICIPANTS.slice(i, i + BATCH_SIZE).map(p => ({
        full_name: p.full_name,
        id_number: p.idnumber,
        user_email: `${p.idnumber}@participant.yms`,
        employment_start_date: p.contractStartDate,
        municipality: p.municipality,
        employment_status: 'active',
        notes: `Role: ${p.currentWageLabel} | Site: ${p.currentSiteName} | Locality: ${p.currentLocalityName}`,
      }));

      try {
        await base44.functions.invoke('importParticipants', { participants: batch });
        created += batch.length;
      } catch (err) {
        errors.push(err.message);
        failed += batch.length;
      }
      setProgress(Math.round(((i + BATCH_SIZE) / PARTICIPANTS.length) * 100));
    }

    setResults({ created, failed, errors });
    setImporting(false);
    if (created > 0) toast.success(`Successfully imported ${created} participants!`);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 md:p-6 pb-24 lg:pb-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <Link to={createPageUrl('HRDashboard')}>
            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">Import Participants</h1>
            <p className="text-slate-400 text-sm">YMS × SEF – Enterprise iLembe & Msinsi Workstreams</p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total', value: PARTICIPANTS.length, color: 'text-white' },
            { label: 'Participants', value: roleCounts['Participant'] || 0, color: 'text-slate-300' },
            { label: 'Field Supervisors', value: roleCounts['Field Supervisor'] || 0, color: 'text-blue-300' },
            { label: 'Coordinators', value: (roleCounts['District Co-Ordinator'] || 0) + (roleCounts['Thematic Co-Ordinator'] || 0), color: 'text-purple-300' },
          ].map(s => (
            <Card key={s.label} className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700/50">
              <CardContent className="p-4 text-center">
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-slate-400 text-xs mt-1">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Import Button / Progress */}
        <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700/50 mb-6">
          <CardContent className="p-6">
            {!results && !importing && (
              <div className="flex flex-col md:flex-row items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <FileSpreadsheet className="w-8 h-8 text-cyan-400" />
                    <div>
                      <p className="text-white font-semibold">participantsfeb22.xlsx</p>
                      <p className="text-slate-400 text-sm">{PARTICIPANTS.length} participants ready to import</p>
                    </div>
                  </div>
                </div>
                <Button
                  onClick={handleImport}
                  disabled={user?.role !== 'admin'}
                  className="bg-cyan-600 hover:bg-cyan-700 gap-2 px-8"
                >
                  <Upload className="w-4 h-4" />
                  Import All {PARTICIPANTS.length} Participants
                </Button>
              </div>
            )}

            {importing && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
                  <p className="text-white font-semibold">Importing participants... {Math.min(progress, 100)}%</p>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-3">
                  <div
                    className="bg-cyan-500 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  />
                </div>
              </div>
            )}

            {results && (
              <div className="flex flex-col md:flex-row items-center gap-4">
                <CheckCircle className="w-10 h-10 text-emerald-400 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-emerald-400 font-semibold text-lg">Import Complete</p>
                  <p className="text-slate-300">
                    <span className="text-white font-bold">{results.created}</span> imported
                    {results.failed > 0 && <span className="text-red-400 ml-2">{results.failed} failed</span>}
                  </p>
                  {results.errors.length > 0 && (
                    <p className="text-red-400 text-sm mt-1">{results.errors[0]}</p>
                  )}
                </div>
                <Button onClick={() => navigate(createPageUrl('HRDashboard'))} className="bg-emerald-600 hover:bg-emerald-700">
                  View Agents
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Preview Table */}
        <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700/50">
          <CardHeader className="border-b border-slate-700/50">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <CardTitle className="text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-cyan-400" />
                Participant List Preview
              </CardTitle>
              <div className="flex flex-wrap gap-2">
                {['all', 'Participant', 'Field Supervisor', 'District Co-Ordinator', 'Thematic Co-Ordinator'].map(r => (
                  <button
                    key={r}
                    onClick={() => setFilter(r)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                      filter === r
                        ? 'bg-cyan-600 text-white'
                        : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    {r === 'all' ? `All (${PARTICIPANTS.length})` : `${r} (${roleCounts[r] || 0})`}
                  </button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-slate-900">
                  <tr className="border-b border-slate-700">
                    <th className="text-left text-slate-400 py-3 px-4">Name</th>
                    <th className="text-left text-slate-400 py-3 px-4">ID Number</th>
                    <th className="text-left text-slate-400 py-3 px-4">Role</th>
                    <th className="text-left text-slate-400 py-3 px-4">Municipality</th>
                    <th className="text-left text-slate-400 py-3 px-4">Locality</th>
                    <th className="text-left text-slate-400 py-3 px-4">Start Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p, idx) => (
                    <tr key={p.idnumber} className={`border-b border-slate-800 ${idx % 2 === 0 ? '' : 'bg-slate-900/30'}`}>
                      <td className="text-white py-2.5 px-4 font-medium">{p.full_name}</td>
                      <td className="text-slate-400 py-2.5 px-4 font-mono text-xs">{p.idnumber}</td>
                      <td className="py-2.5 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${roleColor(p.role)}`}>
                          {p.role}
                        </span>
                      </td>
                      <td className="text-slate-300 py-2.5 px-4">{p.municipality}</td>
                      <td className="text-slate-400 py-2.5 px-4 text-xs">{p.currentLocalityName}</td>
                      <td className="text-slate-400 py-2.5 px-4 text-xs">{p.contractStartDate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-4 border-t border-slate-700 text-center text-slate-500 text-sm">
              Showing {filtered.length} of {PARTICIPANTS.length} participants
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <p className="text-slate-500 text-xs">AfriEconomy Tech™ · Powered by Kwahlelwa Group</p>
        </div>
      </div>
    </div>
  );
}